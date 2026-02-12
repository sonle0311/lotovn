"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from './supabaseClient';
import { LotoCard, LotoTicket, generateTicket, checkRowWin, checkFullCardWin } from './gameLogic';

export interface WinnerData {
    name: string;
    isHost: boolean;
    ticket: LotoTicket;
    markedNumbers: number[];
}
import { RealtimeChannel } from '@supabase/supabase-js';

// ─── Constants ──────────────────────────────────────────────
const MAX_PLAYERS = 20;
const CHAT_THROTTLE_MS = 2000;
const MAX_CHAT_MESSAGES = 50;

export interface Player {
    id: string;
    name: string;
    isHost: boolean;
    status: 'waiting' | 'playing' | 'won';
    isWaitingKinh?: boolean;
    waitingNumbers?: number[];
    lastSeen?: number;
}

export interface ChatMessage {
    id: string;
    senderName: string;
    text: string;
    timestamp: number;
}

// Chuyển presenceState() → Player[]
function presenceToPlayers(presenceState: Record<string, unknown[]>): Player[] {
    const players: Player[] = [];
    for (const [, presences] of Object.entries(presenceState)) {
        for (const presence of presences) {
            const p = presence as Record<string, unknown>;
            players.push({
                id: (p.name as string) || '',
                name: (p.name as string) || '',
                isHost: (p.isHost as boolean) || false,
                status: (p.status as Player['status']) || 'waiting',
                isWaitingKinh: (p.isWaitingKinh as boolean) || false,
                waitingNumbers: (p.waitingNumbers as number[]) || undefined,
                lastSeen: Date.now(),
            });
        }
    }
    return players;
}

export const useGameRoom = (roomId: string, playerName: string) => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
    const [currentNumber, setCurrentNumber] = useState<number | null>(null);
    const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'ended'>('waiting');
    const [myTicket, setMyTicket] = useState<LotoTicket | null>(() => generateTicket());
    const [isRoomFull, setIsRoomFull] = useState(false);
    const [chatCooldown, setChatCooldown] = useState(0);

    // Initial host check from URL
    const isHostInitial = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('host') === 'true';
    const [isHost, setIsHost] = useState(isHostInitial);
    const isHostRef = useRef(isHostInitial);

    const [winner, setWinner] = useState<WinnerData | null>(null);
    const [waitingKinhPlayer, setWaitingKinhPlayer] = useState<Player | null>(null);
    const [markedNumbers, setMarkedNumbers] = useState<Set<number>>(new Set());

    const channelRef = useRef<RealtimeChannel | null>(null);
    const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const gameStatusRef = useRef<'waiting' | 'playing' | 'ended'>('waiting');

    // Fix isHost after client hydration
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const hostParam = new URLSearchParams(window.location.search).get('host') === 'true';
            if (hostParam && !isHost) {
                setIsHost(true);
                isHostRef.current = true;
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keep refs in sync
    useEffect(() => { gameStatusRef.current = gameStatus; }, [gameStatus]);

    // Ensure myTicket exists
    useEffect(() => {
        if (!myTicket) {
            setMyTicket(generateTicket());
        }
    }, [myTicket]);

    // ─── Helper: Thêm message với giới hạn MAX ──────────────
    const appendMessage = useCallback((msg: ChatMessage) => {
        setMessages(prev => {
            const next = [...prev, msg];
            return next.length > MAX_CHAT_MESSAGES ? next.slice(-MAX_CHAT_MESSAGES) : next;
        });
    }, []);

    // ─── Track presence (update trạng thái trên server) ─────
    const trackPresence = useCallback(async (overrides?: Partial<Player>) => {
        if (!channelRef.current) return;
        await channelRef.current.track({
            name: playerName,
            isHost: isHostRef.current,
            status: gameStatusRef.current === 'playing' ? 'playing' : 'waiting',
            ...overrides,
        });
    }, [playerName]);

    // ─── Handle Channel Lifecycle ────────────────────────────
    useEffect(() => {
        if (!roomId || !playerName) return;

        const channel = supabase.channel(`room:${roomId}`, {
            config: {
                presence: { key: playerName },
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
                if (playerList.length >= MAX_PLAYERS) {
                    setIsRoomFull(true);
                }
            })
            .on('presence', { event: 'join' }, ({ newPresences }) => {
                // Anti-cheat: Nếu đã có host khác → tước quyền
                for (const presence of newPresences) {
                    const p = presence as Record<string, unknown>;
                    if (p.isHost && p.name !== playerName && isHostRef.current) {
                        setIsHost(false);
                        isHostRef.current = false;
                    }
                }
            })

            // ─── Host Migration ──────────────────────────────
            .on('broadcast', { event: 'host_change' }, ({ payload }) => {
                const newHostName = payload.newHost as string;
                if (newHostName === playerName) {
                    setIsHost(true);
                    isHostRef.current = true;
                } else {
                    setIsHost(false);
                    isHostRef.current = false;
                }
                // Re-track với isHost mới
                channel.track({
                    name: playerName,
                    isHost: newHostName === playerName,
                    status: gameStatusRef.current === 'playing' ? 'playing' : 'waiting',
                });
            })

            // ─── Game Events ─────────────────────────────────
            .on('broadcast', { event: 'game_start' }, () => {
                setGameStatus('playing');
                gameStatusRef.current = 'playing';
                setDrawnNumbers([]);
                setCurrentNumber(null);
                setWinner(null);
                setMarkedNumbers(new Set());
                // Re-track status 'playing'
                channel.track({
                    name: playerName,
                    isHost: isHostRef.current,
                    status: 'playing',
                });
            })
            .on('broadcast', { event: 'game_reset' }, () => {
                setGameStatus('waiting');
                gameStatusRef.current = 'waiting';
                setDrawnNumbers([]);
                setCurrentNumber(null);
                setWinner(null);
                setMarkedNumbers(new Set());
                setWaitingKinhPlayer(null);
                setMessages([]);
                // Re-track status 'waiting'
                channel.track({
                    name: playerName,
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
            .on('broadcast', { event: 'player_win' }, ({ payload }) => {
                setWinner(payload.winner as WinnerData);
                setGameStatus('ended');
                gameStatusRef.current = 'ended';
            })
            .on('broadcast', { event: 'waiting_kinh' }, ({ payload }) => {
                setWaitingKinhPlayer(payload.player);
                setTimeout(() => setWaitingKinhPlayer(null), 5000);
            });

        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                // Track presence — Supabase tự broadcast cho mọi người
                await channel.track({
                    name: playerName,
                    isHost: isHostRef.current,
                    status: 'waiting',
                });
            }
        });

        return () => {
            // Supabase tự phát leave event khi unsubscribe
            channel.unsubscribe();
            channelRef.current = null;
        };
    }, [roomId, playerName, appendMessage]);

    // ─── Non-host: detect host offline & migrate ────────────
    useEffect(() => {
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
                    .sort((a, b) => a.name.localeCompare(b.name));

                if (sorted.length > 0 && sorted[0].name === playerName) {
                    setIsHost(true);
                    isHostRef.current = true;

                    channelRef.current?.send({
                        type: 'broadcast',
                        event: 'host_change',
                        payload: { newHost: playerName },
                    });

                    // Re-track với isHost = true
                    channelRef.current?.track({
                        name: playerName,
                        isHost: true,
                        status: gameStatusRef.current === 'playing' ? 'playing' : 'waiting',
                    });
                }
            }
        }, 10000);

        return () => clearInterval(checkHostAlive);
    }, [isHost, playerName]);

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
        if (!isHost) return;

        // Auto-reset nếu game đã ended
        if (gameStatusRef.current === 'ended') {
            setDrawnNumbers([]);
            setCurrentNumber(null);
            setWinner(null);
            setMarkedNumbers(new Set());
            setWaitingKinhPlayer(null);
            setMessages([]);
        }

        channelRef.current?.send({
            type: 'broadcast',
            event: 'game_start',
            payload: {},
        });

        // Local update for host (broadcast doesn't echo to sender)
        setGameStatus('playing');
        gameStatusRef.current = 'playing';
        setDrawnNumbers([]);
        setCurrentNumber(null);
        setWinner(null);

        // Re-track status 'playing' cho host
        trackPresence({ status: 'playing' });
    }, [isHost, trackPresence]);

    const drawNumber = useCallback((number: number) => {
        if (!isHost) return;
        channelRef.current?.send({
            type: 'broadcast',
            event: 'number_draw',
            payload: { number },
        });
        // Local update
        setDrawnNumbers(prev => [...prev, number]);
        setCurrentNumber(number);
    }, [isHost]);

    const sendMessage = useCallback((text: string) => {
        if (!text.trim()) return false;

        const now = Date.now();
        const timeSinceLast = now - lastMessageTimeRef.current;

        if (timeSinceLast < CHAT_THROTTLE_MS) {
            const remaining = Math.ceil((CHAT_THROTTLE_MS - timeSinceLast) / 1000);
            setChatCooldown(remaining);

            if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
            cooldownTimerRef.current = setInterval(() => {
                const newRemaining = Math.ceil((CHAT_THROTTLE_MS - (Date.now() - lastMessageTimeRef.current)) / 1000);
                if (newRemaining <= 0) {
                    setChatCooldown(0);
                    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
                } else {
                    setChatCooldown(newRemaining);
                }
            }, 200);

            return false;
        }

        const msg: ChatMessage = {
            id: Math.random().toString(36).substr(2, 9),
            senderName: playerName,
            text,
            timestamp: Date.now(),
        };
        channelRef.current?.send({
            type: 'broadcast',
            event: 'chat',
            payload: msg,
        });
        appendMessage(msg);
        lastMessageTimeRef.current = now;
        setChatCooldown(0);
        return true;
    }, [playerName, appendMessage]);

    const declareWin = useCallback(() => {
        if (!myTicket) return;
        const winnerData: WinnerData = {
            name: playerName,
            isHost,
            ticket: myTicket,
            markedNumbers: Array.from(markedNumbers),
        };
        channelRef.current?.send({
            type: 'broadcast',
            event: 'player_win',
            payload: { winner: winnerData },
        });
        setWinner(winnerData);
        setGameStatus('ended');
        gameStatusRef.current = 'ended';
    }, [playerName, isHost, myTicket, markedNumbers]);

    const declareWaitingKinh = useCallback((isWaiting: boolean, waitingNumbers?: number[]) => {
        const player: Player = {
            id: playerName,
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
    }, [playerName, isHost]);

    const toggleMark = useCallback((num: number, isDrawn: boolean) => {
        if (!isDrawn) return;
        setMarkedNumbers(prevMarked => {
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
        if (!isHost) return;
        channelRef.current?.send({
            type: 'broadcast',
            event: 'game_reset',
            payload: {},
        });
        // Local reset for host
        setGameStatus('waiting');
        gameStatusRef.current = 'waiting';
        setDrawnNumbers([]);
        setCurrentNumber(null);
        setWinner(null);
        setMarkedNumbers(new Set());
        setWaitingKinhPlayer(null);
        setMessages([]);

        // Re-track status 'waiting'
        trackPresence({ status: 'waiting' });
    }, [isHost, trackPresence]);

    const regenerateTicket = useCallback(() => {
        if (gameStatusRef.current !== 'waiting') return;
        const newTicket = generateTicket();
        setMyTicket(newTicket);

        channelRef.current?.send({
            type: 'broadcast',
            event: 'ticket_changed',
            payload: { playerName },
        });
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
    };
};
