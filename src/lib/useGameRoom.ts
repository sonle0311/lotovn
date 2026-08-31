"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from './supabaseClient';
import { LotoTicket, generateTicket } from './gameLogic';
import { claimRoomHost, getRoomHostUserId } from './room-service';
import { updateRoomPlayerCount } from './game-service';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useHydrated } from './useHydrated';

// ─── Extracted utils (pure logic) ───────────────────────────
import { presenceToPlayers } from './presence-logic';
import type { Player } from './presence-logic';
import {
    createChatMessage,
    getChatThrottleRemaining,
    MAX_CHAT_MESSAGES,
    sanitizeText,
} from './chat-logic';
import type { ChatMessage } from './chat-logic';
import { validateWinRequest, MAX_PLAYERS } from './game-state-logic';
import type { WinnerData } from './game-state-logic';
import {
    electHostUserId,
    isAuthorizedHostPayload,
    shouldAcceptHostChange,
} from './host-logic';

// ─── Re-exports for backward compatibility ──────────────────
export type { Player, ChatMessage, WinnerData };
export { MAX_PLAYERS };

function readStoredTicket(roomId: string): LotoTicket | null {
    if (typeof window === "undefined") return null;

    const cached = localStorage.getItem(`loto-ticket-${roomId}`);
    if (!cached) return generateTicket();

    try {
        return JSON.parse(cached) as LotoTicket;
    } catch {
        return generateTicket();
    }
}

function readStoredBoolean(key: string): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(key) === "true";
}

function readStoredWins(key: string): number {
    if (typeof window === "undefined") return 0;

    try {
        const stored = localStorage.getItem(key);
        return stored ? (JSON.parse(stored).wins || 0) : 0;
    } catch {
        return 0;
    }
}

function withHostAuth<T extends Record<string, unknown>>(
    hostUserId: string,
    payload: T
): T & { hostUserId: string } {
    return { ...payload, hostUserId };
}

export const useGameRoom = (roomId: string, playerName: string, playerId: string) => {
    const hydrated = useHydrated();
    const [players, setPlayers] = useState<Player[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
    const [currentNumber, setCurrentNumber] = useState<number | null>(null);
    const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'ended'>('waiting');
    const [ticketState, setTicketState] = useState<{ roomId: string; ticket: LotoTicket } | null>(null);
    const [isRoomFull, setIsRoomFull] = useState(false);
    const [chatCooldown, setChatCooldown] = useState(0);

    // Host resolved from DB (default false until async fetch completes)
    const [isHost, setIsHost] = useState(false);
    const [hostResolved, setHostResolved] = useState(false);
    const isHostRef = useRef(false);
    const knownHostUserIdRef = useRef<string | null>(null);

    const [winner, setWinner] = useState<WinnerData | null>(null);
    const [winRejected, setWinRejected] = useState(false);
    const [waitingKinhPlayer, setWaitingKinhPlayer] = useState<Player | null>(null);
    const [manualMarkedNumbers, setManualMarkedNumbers] = useState<Set<number>>(new Set());

    // Auto-mark: automatically mark drawn numbers on ticket
    const [autoMarkOverride, setAutoMarkOverride] = useState<boolean | null>(null);
    // Keep ticket preference: skip auto-regeneration between rounds
    const [keepTicketOverride, setKeepTicketOverride] = useState<boolean | null>(null);
    // Session win counter persisted to localStorage
    const [sessionWinsState, setSessionWinsState] = useState<{ key: string; wins: number } | null>(null);
    // Emoji reactions floating display
    const [incomingReactions, setIncomingReactions] = useState<{ id: string; emoji: string; senderName: string }[]>([]);

    const channelRef = useRef<RealtimeChannel | null>(null);
    const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const gameStatusRef = useRef<'waiting' | 'playing' | 'ended'>('waiting');
    const waitingKinhTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const committedTicketsRef = useRef<Map<string, LotoTicket>>(new Map());
    const myTicketRef = useRef<LotoTicket | null>(null);
    const sessionWinsKey = `loto-session-${roomId}-${playerId}`;
    const storedTicket = useMemo(
        () => (hydrated ? readStoredTicket(roomId) : null),
        [hydrated, roomId]
    );
    const myTicket = ticketState?.roomId === roomId ? ticketState.ticket : storedTicket;
    const autoMarkEnabled = autoMarkOverride ?? (hydrated ? readStoredBoolean("loto-auto-mark") : false);
    const keepTicketPref = keepTicketOverride ?? (hydrated ? readStoredBoolean("loto-keep-ticket") : false);
    const sessionWins =
        sessionWinsState?.key === sessionWinsKey
            ? sessionWinsState.wins
            : hydrated
                ? readStoredWins(sessionWinsKey)
                : 0;
    const markedNumbers = useMemo(() => {
        if (!autoMarkEnabled || !myTicket || gameStatus !== "playing") return manualMarkedNumbers;

        const next = new Set(manualMarkedNumbers);
        const drawnSet = new Set(drawnNumbers);
        myTicket.frames.forEach((frame) => {
            frame.forEach((row) => {
                row.forEach((num) => {
                    if (num !== null && drawnSet.has(num)) {
                        next.add(num);
                    }
                });
            });
        });
        return next;
    }, [autoMarkEnabled, drawnNumbers, gameStatus, manualMarkedNumbers, myTicket]);

    useEffect(() => {
        myTicketRef.current = myTicket;
    }, [myTicket]);

    const applyHostRole = useCallback((amHost: boolean, hostUserId: string | null) => {
        knownHostUserIdRef.current = hostUserId;
        setIsHost(amHost);
        isHostRef.current = amHost;
    }, []);

    // Resolve host authority from DB on mount — replaces URL ?host=true spoof
    useEffect(() => {
        if (!playerId) return;
        let cancelled = false;
        setHostResolved(false);
        getRoomHostUserId(roomId).then((hostUserId) => {
            if (cancelled) return;
            const amHost = hostUserId === playerId;
            applyHostRole(amHost, hostUserId);
            setHostResolved(true);
            // Re-track after async resolve so presence matches DB authority
            if (channelRef.current) {
                void channelRef.current.track({
                    name: playerName,
                    userId: playerId,
                    isHost: amHost,
                    status: gameStatusRef.current === 'playing' ? 'playing' : 'waiting',
                });
            }
        }).catch(() => {
            if (cancelled) return;
            applyHostRole(false, null);
            setHostResolved(true);
        });
        return () => { cancelled = true; };
    }, [roomId, playerId, playerName, applyHostRole]);

    // Sync player count to DB (host-only, debounced)
    useEffect(() => {
        if (!isHost) return;
        const timer = setTimeout(() => {
            updateRoomPlayerCount(roomId, players.length);
        }, 2000);
        return () => clearTimeout(timer);
    }, [players.length, isHost, roomId]);

    const drawnNumbersRef = useRef<number[]>([]);
    const currentNumberRef = useRef<number | null>(null);

    // Keep refs in sync
    useEffect(() => { gameStatusRef.current = gameStatus; }, [gameStatus]);
    useEffect(() => { drawnNumbersRef.current = drawnNumbers; }, [drawnNumbers]);
    useEffect(() => { currentNumberRef.current = currentNumber; }, [currentNumber]);

    // Save ticket to cache
    useEffect(() => {
        if (myTicket && hydrated) {
            localStorage.setItem(`loto-ticket-${roomId}`, JSON.stringify(myTicket));
        }
    }, [hydrated, myTicket, roomId]);

    // Persist auto-mark preference
    useEffect(() => {
        if (hydrated) {
            localStorage.setItem("loto-auto-mark", String(autoMarkEnabled));
        }
    }, [autoMarkEnabled, hydrated]);

    // Persist keep-ticket preference
    useEffect(() => {
        if (hydrated) {
            localStorage.setItem("loto-keep-ticket", String(keepTicketPref));
        }
    }, [hydrated, keepTicketPref]);

    // ─── Helper: Increment session wins (deduplicates host + non-host paths) ──
    const incrementSessionWins = useCallback(() => {
        setSessionWinsState((prev) => {
            const base = prev?.key === sessionWinsKey ? prev.wins : readStoredWins(sessionWinsKey);
            const next = base + 1;
            if (hydrated) {
                localStorage.setItem(sessionWinsKey, JSON.stringify({ wins: next }));
            }
            return { key: sessionWinsKey, wins: next };
        });
    }, [hydrated, sessionWinsKey]);

    // ─── Helper: Thêm message với giới hạn MAX ──────────────
    const appendMessage = useCallback((msg: ChatMessage) => {
        setMessages(prev => {
            const next = [...prev, msg];
            return next.length > MAX_CHAT_MESSAGES
                ? next.slice(-MAX_CHAT_MESSAGES)
                : next;
        });
    }, []);

    // ─── Track presence (update trạng thái trên server) ─────
    const trackPresence = useCallback(async (overrides?: Partial<Player>) => {
        if (!channelRef.current) return;
        await channelRef.current.track({
            name: playerName,
            userId: playerId,
            isHost: isHostRef.current,
            status: gameStatusRef.current === 'playing' ? 'playing' : 'waiting',
            ...overrides,
        });
    }, [playerId, playerName]);

    const broadcastTicketCommit = useCallback(() => {
        const ticket = myTicketRef.current;
        if (!ticket || !channelRef.current || !playerId) return;
        // Lock first commit only; ignore later regenerations mid-round.
        if (committedTicketsRef.current.has(playerId)) return;
        if (drawnNumbersRef.current.length > 0) return;

        committedTicketsRef.current.set(playerId, ticket);
        channelRef.current.send({
            type: 'broadcast',
            event: 'ticket_commit',
            payload: { playerId, ticket },
        });
    }, [playerId]);

    // ─── Helper: Reset game state ────────────────────────────
    const applyGameReset = useCallback((clearMessages = false) => {
        setDrawnNumbers([]);
        setCurrentNumber(null);
        drawnNumbersRef.current = [];
        currentNumberRef.current = null;
        setWinner(null);
        setWinRejected(false);
        setManualMarkedNumbers(new Set());
        setWaitingKinhPlayer(null);
        committedTicketsRef.current.clear();
        if (clearMessages) setMessages([]);
    }, []);

    const becomeHost = useCallback(async (reason: 'election' | 'db') => {
        applyHostRole(true, playerId);
        if (reason === 'election') {
            await claimRoomHost(roomId);
        }
        await trackPresence({ isHost: true });
    }, [applyHostRole, playerId, roomId, trackPresence]);

    // ─── Handle Channel Lifecycle ────────────────────────────
    useEffect(() => {
        if (!roomId || !playerName || !playerId || !hostResolved) return;

        const channel = supabase.channel(`room:${roomId}`, {
            config: {
                presence: { key: playerId },
            },
        });
        channelRef.current = channel;

        channel
            // ─── Presence Events (thay thế broadcast player sync) ──
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const playerList = presenceToPlayers(state);
                setPlayers(playerList);

                // Kiểm tra phòng đầy
                setIsRoomFull(playerList.length >= MAX_PLAYERS);
            })

            // ─── Host Migration (validated election only) ────
            .on('broadcast', { event: 'host_change' }, ({ payload }) => {
                const newHostUserId = payload.newHostUserId as string;
                const playerList = presenceToPlayers(channel.presenceState());

                if (!shouldAcceptHostChange(playerList, newHostUserId, knownHostUserIdRef.current)) {
                    return;
                }

                const amHost = newHostUserId === playerId;
                applyHostRole(amHost, newHostUserId);
                channel.track({
                    name: playerName,
                    userId: playerId,
                    isHost: amHost,
                    status: gameStatusRef.current === 'playing' ? 'playing' : 'waiting',
                });

                if (amHost) {
                    void claimRoomHost(roomId);
                }
            })

            // ─── Ticket commit (anti fabricated-ticket) ───────
            // First commit wins for the round; reject first-time commits after draws started.
            .on('broadcast', { event: 'ticket_commit' }, ({ payload }) => {
                const pid = payload.playerId as string;
                const ticket = payload.ticket as LotoTicket;
                if (!pid || !ticket) return;
                if (committedTicketsRef.current.has(pid)) return;
                if (drawnNumbersRef.current.length > 0) return;
                committedTicketsRef.current.set(pid, ticket);
            })

            // ─── Game Events (require known host uid) ─────────
            .on('broadcast', { event: 'game_start' }, ({ payload }) => {
                if (!isAuthorizedHostPayload(payload?.hostUserId, knownHostUserIdRef.current)) return;

                setGameStatus('playing');
                gameStatusRef.current = 'playing';
                applyGameReset();
                channel.track({
                    name: playerName,
                    userId: playerId,
                    isHost: isHostRef.current,
                    status: 'playing',
                });
                // Commit current ticket for this round (before any draws)
                broadcastTicketCommit();
            })
            .on('broadcast', { event: 'game_reset' }, ({ payload }) => {
                if (!isAuthorizedHostPayload(payload?.hostUserId, knownHostUserIdRef.current)) return;

                setGameStatus('waiting');
                gameStatusRef.current = 'waiting';
                applyGameReset(true);
                channel.track({
                    name: playerName,
                    userId: playerId,
                    isHost: isHostRef.current,
                    status: 'waiting',
                });
            })
            .on('broadcast', { event: 'number_draw' }, ({ payload }) => {
                if (!isAuthorizedHostPayload(payload?.hostUserId, knownHostUserIdRef.current)) return;

                const number = payload.number as number;
                if (typeof number !== 'number' || number < 1 || number > 90) return;
                if (drawnNumbersRef.current.includes(number)) return;

                setDrawnNumbers(prev => [...prev, number]);
                setCurrentNumber(number);
            })
            .on('broadcast', { event: 'chat' }, ({ payload }) => {
                const raw = payload as ChatMessage;
                appendMessage({
                    ...raw,
                    senderName: sanitizeText(raw.senderName || '', 20),
                    text: sanitizeText(raw.text || '', 200),
                });
            })
            // ─── Win Validation Flow ──────────────────────────
            .on('broadcast', { event: 'win_request' }, ({ payload }) => {
                if (!isHostRef.current) return;

                const req = payload as Parameters<typeof validateWinRequest>[0];
                const committed = committedTicketsRef.current.get(req.playerId);
                const result = validateWinRequest(req, drawnNumbersRef.current, committed);

                if (!result.valid) {
                    channel.send({
                        type: 'broadcast',
                        event: 'win_rejected',
                        payload: withHostAuth(knownHostUserIdRef.current || playerId, {
                            name: req.name,
                            playerId: req.playerId,
                            reason: result.reason,
                        }),
                    });
                    return;
                }

                channel.send({
                    type: 'broadcast',
                    event: 'game_end',
                    payload: withHostAuth(knownHostUserIdRef.current || playerId, { winner: result.winner }),
                });

                setWinner(result.winner);
                setGameStatus('ended');
                gameStatusRef.current = 'ended';
                if (result.winner.playerId === playerId) incrementSessionWins();
            })
            .on('broadcast', { event: 'game_end' }, ({ payload }) => {
                if (!isAuthorizedHostPayload(payload?.hostUserId, knownHostUserIdRef.current)) return;

                setWinner(payload.winner as WinnerData);
                setGameStatus('ended');
                gameStatusRef.current = 'ended';
                if ((payload.winner as WinnerData).playerId === playerId) incrementSessionWins();
            })
            .on('broadcast', { event: 'win_rejected' }, ({ payload }) => {
                if ((payload.playerId as string) === playerId || (payload.name as string) === playerName) {
                    setWinRejected(true);
                    setTimeout(() => setWinRejected(false), 3000);
                }
            })
            .on('broadcast', { event: 'waiting_kinh' }, ({ payload }) => {
                setWaitingKinhPlayer(payload.player);
                if (waitingKinhTimerRef.current) clearTimeout(waitingKinhTimerRef.current);
                waitingKinhTimerRef.current = setTimeout(() => setWaitingKinhPlayer(null), 5000);
            })
            .on('broadcast', { event: 'sync_request' }, () => {
                if (isHostRef.current) {
                    channel.send({
                        type: 'broadcast',
                        event: 'sync_state',
                        payload: withHostAuth(knownHostUserIdRef.current || playerId, {
                            drawnNumbers: drawnNumbersRef.current,
                            gameStatus: gameStatusRef.current,
                            currentNumber: currentNumberRef.current,
                            // Help late joiners validate wins for already-committed players
                            committedTickets: Array.from(committedTicketsRef.current.entries()).map(
                                ([pid, ticket]) => ({ playerId: pid, ticket })
                            ),
                        }),
                    });
                }
            })
            .on('broadcast', { event: 'sync_state' }, ({ payload }) => {
                if (!isAuthorizedHostPayload(payload?.hostUserId, knownHostUserIdRef.current)) return;
                if (isHostRef.current) return;

                const incomingDrawn = payload.drawnNumbers as number[];
                if (!Array.isArray(incomingDrawn)) return;
                if (incomingDrawn.length < drawnNumbersRef.current.length) return;

                setDrawnNumbers(incomingDrawn);
                setGameStatus(payload.gameStatus);
                setCurrentNumber(payload.currentNumber);
                gameStatusRef.current = payload.gameStatus;

                const commits = payload.committedTickets as { playerId: string; ticket: LotoTicket }[] | undefined;
                if (Array.isArray(commits)) {
                    for (const entry of commits) {
                        if (entry?.playerId && entry?.ticket) {
                            committedTicketsRef.current.set(entry.playerId, entry.ticket);
                        }
                    }
                }

                if (payload.gameStatus === 'playing' && myTicketRef.current) {
                    broadcastTicketCommit();
                }
            })
            .on('broadcast', { event: 'emoji_reaction' }, ({ payload }) => {
                const reaction = payload as { id: string; emoji: string; senderName: string };
                setIncomingReactions(prev => [...prev, reaction]);
                setTimeout(() => {
                    setIncomingReactions(prev => prev.filter(r => r.id !== reaction.id));
                }, 2500);
            });

        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({
                    name: playerName,
                    userId: playerId,
                    isHost: isHostRef.current,
                    status: 'waiting',
                });

                if (!isHostRef.current) {
                    channel.send({
                        type: 'broadcast',
                        event: 'sync_request',
                        payload: {}
                    });
                }

                if (gameStatusRef.current === 'playing') {
                    broadcastTicketCommit();
                }
            }
        });

        return () => {
            channel.unsubscribe();
            channelRef.current = null;
            if (waitingKinhTimerRef.current) clearTimeout(waitingKinhTimerRef.current);
        };
    }, [
        roomId,
        playerName,
        playerId,
        hostResolved,
        appendMessage,
        applyGameReset,
        incrementSessionWins,
        applyHostRole,
        broadcastTicketCommit,
    ]);

    // ─── Non-host: detect host offline & migrate ────────────
    useEffect(() => {
        if (!playerId) return;
        if (isHost) return;

        const checkHostAlive = setInterval(() => {
            if (!channelRef.current) return;
            const state = channelRef.current.presenceState();
            const playerList = presenceToPlayers(state);
            const elected = electHostUserId(
                // Treat known host as host flag for election if still present
                playerList.map((p) => ({
                    id: p.id,
                    isHost: p.isHost || p.id === knownHostUserIdRef.current,
                }))
            );

            const knownStillHere = knownHostUserIdRef.current
                ? playerList.some((p) => p.id === knownHostUserIdRef.current)
                : false;

            if (knownStillHere) return;
            if (!elected || elected !== playerId) return;

            void becomeHost('election').then(() => {
                channelRef.current?.send({
                    type: 'broadcast',
                    event: 'host_change',
                    payload: { newHostUserId: playerId },
                });
            });
        }, 10000);

        return () => clearInterval(checkHostAlive);
    }, [isHost, playerId, becomeHost]);

    // ─── Chat Cooldown Timer ────────────────────────────────
    const lastMessageTimeRef = useRef(0);

    useEffect(() => {
        return () => {
            if (cooldownTimerRef.current) {
                clearInterval(cooldownTimerRef.current);
            }
        };
    }, []);

    // ─── Actions ────────────────────────────────────────────
    const startGame = useCallback(() => {
        if (!isHostRef.current || !knownHostUserIdRef.current) return;

        if (gameStatusRef.current === 'ended') {
            applyGameReset(true);
        }

        const hostUserId = knownHostUserIdRef.current;
        channelRef.current?.send({
            type: 'broadcast',
            event: 'game_start',
            payload: withHostAuth(hostUserId, {}),
        });

        setGameStatus('playing');
        gameStatusRef.current = 'playing';
        applyGameReset();
        trackPresence({ status: 'playing' });
        broadcastTicketCommit();
    }, [applyGameReset, trackPresence, broadcastTicketCommit]);

    const drawNumber = useCallback((number: number) => {
        if (!isHostRef.current || !knownHostUserIdRef.current) return;
        if (number < 1 || number > 90) return;
        if (drawnNumbersRef.current.includes(number)) return;

        channelRef.current?.send({
            type: 'broadcast',
            event: 'number_draw',
            payload: withHostAuth(knownHostUserIdRef.current, { number }),
        });
        setDrawnNumbers(prev => [...prev, number]);
        setCurrentNumber(number);
    }, []);

    const sendMessage = useCallback((text: string) => {
        const throttleRemaining = getChatThrottleRemaining(lastMessageTimeRef.current);

        if (throttleRemaining > 0) {
            setChatCooldown(throttleRemaining);

            if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
            cooldownTimerRef.current = setInterval(() => {
                const newRemaining = getChatThrottleRemaining(lastMessageTimeRef.current);
                if (newRemaining <= 0) {
                    setChatCooldown(0);
                    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
                } else {
                    setChatCooldown(newRemaining);
                }
            }, 200);

            return false;
        }

        const msg = createChatMessage(playerName, text);
        if (!msg.text) return false;

        channelRef.current?.send({
            type: 'broadcast',
            event: 'chat',
            payload: msg,
        });
        appendMessage(msg);
        lastMessageTimeRef.current = Date.now();
        setChatCooldown(0);
        return true;
    }, [playerName, appendMessage]);

    const declareWin = useCallback(() => {
        if (!myTicket || !playerId) return;

        // Must already have committed at round start — do not allow late overwrite.
        if (!committedTicketsRef.current.has(playerId)) {
            broadcastTicketCommit();
        }

        const committed = committedTicketsRef.current.get(playerId) || myTicket;
        const request = {
            playerId,
            name: playerName,
            isHost: isHostRef.current,
            ticket: committed,
            markedNumbers: Array.from(markedNumbers),
        };

        channelRef.current?.send({
            type: 'broadcast',
            event: 'win_request',
            payload: request,
        });

        if (isHostRef.current) {
            const result = validateWinRequest(
                request,
                drawnNumbersRef.current,
                committedTicketsRef.current.get(playerId)
            );
            if (result.valid) {
                channelRef.current?.send({
                    type: 'broadcast',
                    event: 'game_end',
                    payload: withHostAuth(knownHostUserIdRef.current || playerId, { winner: result.winner }),
                });
                setWinner(result.winner);
                setGameStatus('ended');
                gameStatusRef.current = 'ended';
                if (result.winner.playerId === playerId) incrementSessionWins();
            } else {
                setWinRejected(true);
                setTimeout(() => setWinRejected(false), 3000);
            }
        }
    }, [playerId, playerName, myTicket, markedNumbers, incrementSessionWins, broadcastTicketCommit]);

    const declareWaitingKinh = useCallback((isWaiting: boolean, waitingNumbers?: number[]) => {
        const player: Player = {
            id: playerId,
            name: playerName,
            isHost,
            status: 'playing',
            isWaitingKinh: isWaiting,
            waitingNumbers
        };
        if (isWaiting) {
            channelRef.current?.send({
                type: 'broadcast',
                event: 'waiting_kinh',
                payload: { player },
            });
        }
    }, [playerId, playerName, isHost]);

    const toggleMark = useCallback((num: number, isDrawn: boolean) => {
        if (!isDrawn) return;
        setManualMarkedNumbers(prevMarked => {
            const next = new Set(prevMarked);
            if (next.has(num)) {
                next.delete(num);
            } else {
                next.add(num);
            }
            return next;
        });
    }, []);

    const resetGame = useCallback(() => {
        if (!isHostRef.current || !knownHostUserIdRef.current) return;
        channelRef.current?.send({
            type: 'broadcast',
            event: 'game_reset',
            payload: withHostAuth(knownHostUserIdRef.current, {}),
        });
        setGameStatus('waiting');
        gameStatusRef.current = 'waiting';
        applyGameReset(true);
        trackPresence({ status: 'waiting' });
    }, [applyGameReset, trackPresence]);

    const regenerateTicket = useCallback(() => {
        if (gameStatusRef.current !== 'waiting') return;
        if (keepTicketPref) return;
        const newTicket = generateTicket();
        setTicketState({ roomId, ticket: newTicket });
    }, [keepTicketPref, roomId]);

    const forceRegenerateTicket = useCallback(() => {
        if (gameStatusRef.current !== 'waiting') return;
        setTicketState({ roomId, ticket: generateTicket() });
        setKeepTicketOverride(false);
    }, [roomId]);

    const toggleAutoMark = useCallback(() => {
        if (autoMarkEnabled) {
            setManualMarkedNumbers((prevMarked) => {
                const next = new Set(prevMarked);
                markedNumbers.forEach((num) => next.add(num));
                return next;
            });
        }

        setAutoMarkOverride(!autoMarkEnabled);
    }, [autoMarkEnabled, markedNumbers]);

    const toggleKeepTicket = useCallback((val?: boolean) =>
        setKeepTicketOverride((prev) => {
            const current = prev ?? readStoredBoolean("loto-keep-ticket");
            return val !== undefined ? val : !current;
        }), []);

    const sendReaction = useCallback((emoji: string) => {
        const reaction = {
            id: Math.random().toString(36).substring(2, 9),
            emoji,
            senderName: playerName,
        };
        channelRef.current?.send({
            type: 'broadcast',
            event: 'emoji_reaction',
            payload: reaction,
        });
        setIncomingReactions(prev => [...prev, reaction]);
        setTimeout(() => {
            setIncomingReactions(prev => prev.filter(r => r.id !== reaction.id));
        }, 2500);
    }, [playerName]);

    return {
        players,
        messages,
        drawnNumbers,
        currentNumber,
        gameStatus,
        myTicket,
        isHost,
        winner,
        winRejected,
        waitingKinhPlayer,
        markedNumbers,
        isRoomFull,
        chatCooldown,
        startGame,
        drawNumber,
        sendMessage,
        declareWin,
        declareWaitingKinh,
        toggleMark,
        resetGame,
        regenerateTicket,
        autoMarkEnabled,
        toggleAutoMark,
        keepTicketPref,
        toggleKeepTicket,
        forceRegenerateTicket,
        sessionWins,
        incomingReactions,
        sendReaction,
    };
};
