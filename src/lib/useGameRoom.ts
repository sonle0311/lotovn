"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from './supabaseClient';
import { LotoCard, LotoTicket, generateTicket, checkRowWin, checkFullCardWin } from './gameLogic';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Player {
    id: string;
    name: string;
    isHost: boolean;
    status: 'waiting' | 'playing' | 'won';
    isWaitingKinh?: boolean;
}

export interface ChatMessage {
    id: string;
    senderName: string;
    text: string;
    timestamp: number;
}

export const useGameRoom = (roomId: string, playerName: string) => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
    const [currentNumber, setCurrentNumber] = useState<number | null>(null);
    const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'ended'>('waiting');

    // Initialize ticket using factory-style to prevent re-execution on every render
    const [myTicket, setMyTicket] = useState<LotoTicket | null>(() => generateTicket());

    // Initial host check from URL
    const isHostInitial = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('host') === 'true';
    const [isHost, setIsHost] = useState(isHostInitial);
    const isHostRef = useRef(isHostInitial);

    const [winner, setWinner] = useState<Player | null>(null);
    const [waitingKinhPlayer, setWaitingKinhPlayer] = useState<Player | null>(null);
    const [markedNumbers, setMarkedNumbers] = useState<Set<number>>(new Set());

    const channelRef = useRef<RealtimeChannel | null>(null);

    // Ensure myTicket exists (fallback)
    useEffect(() => {
        if (!myTicket) {
            setMyTicket(generateTicket());
        }
    }, [myTicket]);

    // Handle Channel Lifecycle
    useEffect(() => {
        if (!roomId || !playerName) return;

        const channel = supabase.channel(`room:${roomId}`, {
            config: {
                presence: {
                    key: playerName,
                },
            },
        });

        channelRef.current = channel;

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const onlinePlayers: Player[] = Object.keys(state).map((key) => {
                    const presences = state[key] as any;
                    return {
                        id: key,
                        name: key,
                        isHost: presences[0]?.isHost || false,
                        status: presences[0]?.status || 'waiting',
                        isWaitingKinh: presences[0]?.isWaitingKinh || false,
                    };
                });

                // Host logic - purely based on presence state
                const host = onlinePlayers.find(p => p.isHost);
                if (!host && onlinePlayers.length > 0) {
                    // Claim host if first in list
                    if (onlinePlayers[0].name === playerName) {
                        setIsHost(true);
                        isHostRef.current = true;
                        // REMOVED channel.track here to prevent infinite loop.
                        // The track call in the useEffect below will handle it.
                    }
                } else if (host) {
                    const meIsHost = host.name === playerName;
                    if (isHost !== meIsHost) {
                        setIsHost(meIsHost);
                        isHostRef.current = meIsHost;
                    }
                }

                setPlayers(onlinePlayers);
            })
            .on('broadcast', { event: 'game_start' }, () => {
                setGameStatus('playing');
                setDrawnNumbers([]);
                setCurrentNumber(null);
                setWinner(null);
                setMarkedNumbers(new Set());
            })
            .on('broadcast', { event: 'game_reset' }, () => {
                setGameStatus('waiting');
                setDrawnNumbers([]);
                setCurrentNumber(null);
                setWinner(null);
                setMarkedNumbers(new Set());
                setMyTicket(generateTicket());
            })
            .on('broadcast', { event: 'number_draw' }, ({ payload }) => {
                setDrawnNumbers(prev => [...prev, payload.number]);
                setCurrentNumber(payload.number);
            })
            .on('broadcast', { event: 'chat' }, ({ payload }) => {
                setMessages(prev => [...prev, payload]);
            })
            .on('broadcast', { event: 'player_win' }, ({ payload }) => {
                setWinner(payload.player);
                setGameStatus('ended');
            })
            .on('broadcast', { event: 'waiting_kinh' }, ({ payload }) => {
                setWaitingKinhPlayer(payload.player);
                setTimeout(() => setWaitingKinhPlayer(null), 5000);
            });

        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({ name: playerName, isHost: isHostRef.current, status: 'waiting' });
            }
        });

        return () => {
            channel.unsubscribe();
            channelRef.current = null;
        };
    }, [roomId, playerName]);

    // Single source of truth for tracking presence to prevent infinite loops
    useEffect(() => {
        if (channelRef.current && playerName) {
            channelRef.current.track({ name: playerName, isHost: isHost, status: gameStatus });
        }
    }, [gameStatus, isHost, playerName]);

    // Actions
    const startGame = useCallback(() => {
        if (!isHost) return;
        channelRef.current?.send({
            type: 'broadcast',
            event: 'game_start',
            payload: {},
        });
        setGameStatus('playing');
        setDrawnNumbers([]);
        setCurrentNumber(null);
        setWinner(null);
    }, [isHost]);

    const drawNumber = useCallback((number: number) => {
        if (!isHost) return;
        channelRef.current?.send({
            type: 'broadcast',
            event: 'number_draw',
            payload: { number },
        });
        // Optimistic update for host to avoid race conditions in drawing logic
        setDrawnNumbers(prev => [...prev, number]);
        setCurrentNumber(number);
    }, [isHost]);

    const sendMessage = useCallback((text: string) => {
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
        setMessages(prev => [...prev, msg]);
    }, [playerName]);

    const declareWin = useCallback(() => {
        const player: Player = { id: playerName, name: playerName, isHost, status: 'won' };
        channelRef.current?.send({
            type: 'broadcast',
            event: 'player_win',
            payload: { player },
        });
        setWinner(player);
        setGameStatus('ended');
    }, [playerName, isHost]);

    const declareWaitingKinh = useCallback((isWaiting: boolean) => {
        const player: Player = { id: playerName, name: playerName, isHost, status: 'playing', isWaitingKinh: isWaiting };
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
        setMarkedNumbers(prev => {
            const next = new Set(prev);
            if (next.has(num)) next.delete(num);
            else next.add(num);
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
    }, [isHost]);

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
        startGame,
        drawNumber,
        sendMessage,
        declareWin,
        declareWaitingKinh,
        toggleMark,
        resetGame,
    };
};
