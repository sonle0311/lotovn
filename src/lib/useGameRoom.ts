"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from './supabaseClient';
import { LotoTicket, generateTicket } from './gameLogic';
import { getRoomHostUserId } from './room-service';
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
} from './chat-logic';
import type { ChatMessage } from './chat-logic';
import { validateWinRequest, MAX_PLAYERS } from './game-state-logic';
import type { WinnerData } from './game-state-logic';

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
    const isHostRef = useRef(false);

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

    // Resolve host authority from DB on mount — replaces URL ?host=true spoof
    useEffect(() => {
        if (!playerId) return;
        let cancelled = false;
        getRoomHostUserId(roomId).then((hostUserId) => {
            if (cancelled) return;
            const amHost = hostUserId === playerId;
            setIsHost(amHost);
            isHostRef.current = amHost;
        });
        return () => { cancelled = true; };
    }, [roomId, playerId]);

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

    // ─── Helper: Reset game state ────────────────────────────
    const applyGameReset = useCallback((clearMessages = false) => {
        setDrawnNumbers([]);
        setCurrentNumber(null);
        setWinner(null);
        setWinRejected(false);
        setManualMarkedNumbers(new Set());
        setWaitingKinhPlayer(null);
        if (clearMessages) setMessages([]);
    }, []);

    // ─── Handle Channel Lifecycle ────────────────────────────
    useEffect(() => {
        if (!roomId || !playerName || !playerId) return;

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
            .on('presence', { event: 'join' }, ({ newPresences }) => {
                // Anti-cheat: Nếu đã có host khác → tước quyền
                for (const presence of newPresences) {
                    const p = presence as Record<string, unknown>;
                    if (p.isHost && p.userId !== playerId && isHostRef.current) {
                        setIsHost(false);
                        isHostRef.current = false;
                    }
                }
            })

            // ─── Host Migration ──────────────────────────────
            .on('broadcast', { event: 'host_change' }, ({ payload }) => {
                const newHostUserId = payload.newHostUserId as string;
                if (newHostUserId === playerId) {
                    setIsHost(true);
                    isHostRef.current = true;
                } else {
                    setIsHost(false);
                    isHostRef.current = false;
                }
                // Re-track với isHost mới
                channel.track({
                    name: playerName,
                    userId: playerId,
                    isHost: newHostUserId === playerId,
                    status: gameStatusRef.current === 'playing' ? 'playing' : 'waiting',
                });
            })

            // ─── Game Events ─────────────────────────────────
            .on('broadcast', { event: 'game_start' }, () => {
                setGameStatus('playing');
                gameStatusRef.current = 'playing';
                applyGameReset();
                // Re-track status 'playing'
                channel.track({
                    name: playerName,
                    userId: playerId,
                    isHost: isHostRef.current,
                    status: 'playing',
                });
            })
            .on('broadcast', { event: 'game_reset' }, () => {
                setGameStatus('waiting');
                gameStatusRef.current = 'waiting';
                applyGameReset(true);
                // Re-track status 'waiting'
                channel.track({
                    name: playerName,
                    userId: playerId,
                    isHost: isHostRef.current,
                    status: 'waiting',
                });
            })
            .on('broadcast', { event: 'number_draw' }, ({ payload }) => {
                setDrawnNumbers(prev => [...prev, payload.number]);
                setCurrentNumber(payload.number);
            })
            .on('broadcast', { event: 'chat' }, ({ payload }) => {
                appendMessage(payload);
            })
            // ─── Win Validation Flow ──────────────────────────
            // Step 1: Any player requests win — host validates
            .on('broadcast', { event: 'win_request' }, ({ payload }) => {
                if (!isHostRef.current) return;

                const result = validateWinRequest(payload as Parameters<typeof validateWinRequest>[0], drawnNumbersRef.current);

                if (!result.valid) {
                    channel.send({ type: 'broadcast', event: 'win_rejected', payload: { name: (payload as { name: string }).name, reason: result.reason } });
                    return;
                }

                channel.send({ type: 'broadcast', event: 'game_end', payload: { winner: result.winner } });

                // Host local update (broadcast doesn't echo to sender)
                setWinner(result.winner);
                setGameStatus('ended');
                gameStatusRef.current = 'ended';
                if (result.winner.name === playerName) incrementSessionWins();
            })
            // Step 2: All non-host clients receive confirmed win
            .on('broadcast', { event: 'game_end' }, ({ payload }) => {
                setWinner(payload.winner as WinnerData);
                setGameStatus('ended');
                gameStatusRef.current = 'ended';
                // Increment session score if this player won
                if ((payload.winner as WinnerData).name === playerName) incrementSessionWins();
            })
            // Step 3: Requester gets rejection feedback
            .on('broadcast', { event: 'win_rejected' }, ({ payload }) => {
                if ((payload.name as string) === playerName) {
                    setWinRejected(true);
                    setTimeout(() => setWinRejected(false), 3000);
                }
            })
            .on('broadcast', { event: 'waiting_kinh' }, ({ payload }) => {
                setWaitingKinhPlayer(payload.player);
                if (waitingKinhTimerRef.current) clearTimeout(waitingKinhTimerRef.current);
                waitingKinhTimerRef.current = setTimeout(() => setWaitingKinhPlayer(null), 5000);
            })
            // ─── Late Sync Sync ──────────────────────────────
            .on('broadcast', { event: 'sync_request' }, () => {
                if (isHostRef.current) {
                    channel.send({
                        type: 'broadcast',
                        event: 'sync_state',
                        payload: {
                            drawnNumbers: drawnNumbersRef.current,
                            gameStatus: gameStatusRef.current,
                            currentNumber: currentNumberRef.current
                        }
                    });
                }
            })
            .on('broadcast', { event: 'sync_state' }, ({ payload }) => {
                // Chỉ nhận sync nếu mình không phải host và không bị rollback (số mới >= số cũ)
                if (!isHostRef.current &&
                    (payload.drawnNumbers as number[]).length >= drawnNumbersRef.current.length) {
                    setDrawnNumbers(payload.drawnNumbers);
                    setGameStatus(payload.gameStatus);
                    setCurrentNumber(payload.currentNumber);
                    gameStatusRef.current = payload.gameStatus;
                }
            })
            .on('broadcast', { event: 'emoji_reaction' }, ({ payload }) => {
                const reaction = payload as { id: string; emoji: string; senderName: string };
                setIncomingReactions(prev => [...prev, reaction]);
                // Auto-remove sau 2.5s
                setTimeout(() => {
                    setIncomingReactions(prev => prev.filter(r => r.id !== reaction.id));
                }, 2500);
            });

        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                // Track presence — Supabase tự broadcast cho mọi người
                await channel.track({
                    name: playerName,
                    userId: playerId,
                    isHost: isHostRef.current,
                    status: 'waiting',
                });

                // Nếu không phải host ban đầu, yêu cầu đồng bộ
                if (!isHostRef.current) {
                    channel.send({
                        type: 'broadcast',
                        event: 'sync_request',
                        payload: {}
                    });
                }
            }
        });

        return () => {
            // Supabase tự phát leave event khi unsubscribe
            channel.unsubscribe();
            channelRef.current = null;
            if (waitingKinhTimerRef.current) clearTimeout(waitingKinhTimerRef.current);
        };
    }, [roomId, playerName, playerId, appendMessage, applyGameReset, incrementSessionWins]);

    // ─── Non-host: detect host offline & migrate ────────────
    useEffect(() => {
        if (!playerId) return;
        if (isHost) return;

        const checkHostAlive = setInterval(() => {
            if (!channelRef.current) return;
            const state = channelRef.current.presenceState();
            const playerList = presenceToPlayers(state);
            const host = playerList.find(p => p.isHost);

            if (!host && playerList.length > 0) {
                // Host biến mất → player đầu tiên nhận host
                const sorted = playerList
                    .filter(p => !p.isHost)
                    .sort((a, b) => a.id.localeCompare(b.id));

                if (sorted.length > 0 && sorted[0].id === playerId) {
                    setIsHost(true);
                    isHostRef.current = true;

                    channelRef.current?.send({
                        type: 'broadcast',
                        event: 'host_change',
                        payload: { newHostUserId: playerId },
                    });

                    // Re-track với isHost = true
                    channelRef.current?.track({
                        name: playerName,
                        userId: playerId,
                        isHost: true,
                        status: gameStatusRef.current === 'playing' ? 'playing' : 'waiting',
                    });
                }
            }
        }, 10000);

        return () => clearInterval(checkHostAlive);
    }, [isHost, playerId, playerName]);

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
        if (!isHostRef.current) return;

        // Auto-reset nếu game đã ended
        if (gameStatusRef.current === 'ended') {
            applyGameReset(true);
        }

        channelRef.current?.send({
            type: 'broadcast',
            event: 'game_start',
            payload: {},
        });

        // Local update for host (broadcast doesn't echo to sender)
        setGameStatus('playing');
        gameStatusRef.current = 'playing';
        applyGameReset();

        // Re-track status 'playing' cho host
        trackPresence({ status: 'playing' });
    }, [applyGameReset, trackPresence]);

    const drawNumber = useCallback((number: number) => {
        if (!isHostRef.current) return;
        channelRef.current?.send({
            type: 'broadcast',
            event: 'number_draw',
            payload: { number },
        });
        // Local update
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
        if (!myTicket) return;

        const request = {
            name: playerName,
            isHost: isHostRef.current,
            ticket: myTicket,
            markedNumbers: Array.from(markedNumbers),
        };

        channelRef.current?.send({
            type: 'broadcast',
            event: 'win_request',
            payload: request,
        });

        // Host: broadcast không echo lại, validate locally
        if (isHostRef.current) {
            const result = validateWinRequest(request, drawnNumbersRef.current);
            if (result.valid) {
                channelRef.current?.send({ type: 'broadcast', event: 'game_end', payload: { winner: result.winner } });
                setWinner(result.winner);
                setGameStatus('ended');
                gameStatusRef.current = 'ended';
                if (result.winner.name === playerName) incrementSessionWins();
            } else {
                setWinRejected(true);
                setTimeout(() => setWinRejected(false), 3000);
            }
        }
    }, [playerName, myTicket, markedNumbers, incrementSessionWins]);

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
        if (!isHostRef.current) return;
        channelRef.current?.send({
            type: 'broadcast',
            event: 'game_reset',
            payload: {},
        });
        // Local reset for host
        setGameStatus('waiting');
        gameStatusRef.current = 'waiting';
        applyGameReset(true);

        // Re-track status 'waiting'
        trackPresence({ status: 'waiting' });
    }, [applyGameReset, trackPresence]);

    const regenerateTicket = useCallback(() => {
        if (gameStatusRef.current !== 'waiting') return;
        if (keepTicketPref) return; // user wants to keep ticket
        const newTicket = generateTicket();
        setTicketState({ roomId, ticket: newTicket });
    }, [keepTicketPref, roomId]);

    // Force regenerate always generates new ticket and clears keep preference
    const forceRegenerateTicket = useCallback(() => {
        if (gameStatusRef.current !== 'waiting') return;
        setTicketState({ roomId, ticket: generateTicket() });
        setKeepTicketOverride(false);
    }, [roomId]);

    const toggleAutoMark = useCallback(() => {
        if (autoMarkEnabled) {
            // Preserve visible marks when switching auto-mark off mid-game.
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
        // Show locally too (broadcast doesn't echo)
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
