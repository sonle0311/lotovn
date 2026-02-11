"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from './supabaseClient';
import { LotoCard, LotoTicket, generateTicket, checkRowWin, checkFullCardWin } from './gameLogic';
import { RealtimeChannel } from '@supabase/supabase-js';

// ─── Constants ──────────────────────────────────────────────
const MAX_PLAYERS = 20;
const CHAT_THROTTLE_MS = 2000; // 2 giây giữa mỗi tin nhắn
const MAX_CHAT_MESSAGES = 50;  // Giới hạn lịch sử chat
const HEARTBEAT_INTERVAL_MS = 10000; // Host gửi heartbeat mỗi 10 giây
const HEARTBEAT_TIMEOUT_MS = 25000;  // Coi player offline nếu không thấy heartbeat 25s

export interface Player {
    id: string;
    name: string;
    isHost: boolean;
    status: 'waiting' | 'playing' | 'won';
    isWaitingKinh?: boolean;
    waitingNumbers?: number[];
    lastSeen?: number; // Timestamp cuối cùng nhìn thấy player
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
    const [myTicket, setMyTicket] = useState<LotoTicket | null>(() => generateTicket());
    const [isRoomFull, setIsRoomFull] = useState(false);
    const [chatCooldown, setChatCooldown] = useState(0);

    // Initial host check from URL
    const isHostInitial = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('host') === 'true';
    const [isHost, setIsHost] = useState(isHostInitial);
    const isHostRef = useRef(isHostInitial);

    const [winner, setWinner] = useState<Player | null>(null);
    const [waitingKinhPlayer, setWaitingKinhPlayer] = useState<Player | null>(null);
    const [markedNumbers, setMarkedNumbers] = useState<Set<number>>(new Set());

    const channelRef = useRef<RealtimeChannel | null>(null);
    const playersRef = useRef<Player[]>([]); // Ref to avoid stale closures
    const lastMessageTimeRef = useRef(0); // Throttle: thời gian gửi tin cuối
    const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const gameStatusRef = useRef<'waiting' | 'playing' | 'ended'>('waiting');

    // Fix isHost after client hydration (window undefined during SSR)
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
    useEffect(() => { playersRef.current = players; }, [players]);
    useEffect(() => { gameStatusRef.current = gameStatus; }, [gameStatus]);

    // Ensure myTicket exists (fallback)
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

    // ─── Helper: Thêm hoặc cập nhật player ──────────────────
    const upsertPlayer = useCallback((player: Player) => {
        setPlayers(prev => {
            const exists = prev.find(p => p.name === player.name);
            if (exists) {
                return prev.map(p => p.name === player.name ? { ...p, ...player, lastSeen: Date.now() } : p);
            }
            // Kiểm tra giới hạn phòng
            if (prev.length >= MAX_PLAYERS) {
                return prev;
            }
            return [...prev, { ...player, lastSeen: Date.now() }];
        });
    }, []);

    // ─── Helper: Xóa player ─────────────────────────────────
    const removePlayer = useCallback((name: string) => {
        setPlayers(prev => prev.filter(p => p.name !== name));
    }, []);

    // ─── Handle Channel Lifecycle (Broadcast thuần) ─────────
    useEffect(() => {
        if (!roomId || !playerName) return;

        const channel = supabase.channel(`room:${roomId}`);
        channelRef.current = channel;

        const handleReset = () => {
            setGameStatus('waiting');
            gameStatusRef.current = 'waiting';
            setDrawnNumbers([]);
            setCurrentNumber(null);
            setWinner(null);
            setMarkedNumbers(new Set());
            setWaitingKinhPlayer(null);
            setMyTicket(generateTicket());
            setMessages([]); // Dọn dẹp chat khi reset game
        };

        const myPlayer: Player = {
            id: playerName,
            name: playerName,
            isHost: isHostRef.current,
            status: 'waiting',
            lastSeen: Date.now(),
        };

        channel
            // ─── Player Management Events ────────────────────
            .on('broadcast', { event: 'player_join' }, ({ payload }) => {
                const joinedPlayer = payload.player as Player;

                // Kiểm tra phòng đầy
                if (playersRef.current.length >= MAX_PLAYERS && joinedPlayer.name !== playerName) {
                    // Nếu host, thông báo phòng đầy
                    if (isHostRef.current) {
                        channel.send({
                            type: 'broadcast',
                            event: 'room_full',
                            payload: { targetPlayer: joinedPlayer.name },
                        });
                    }
                    return;
                }

                upsertPlayer({
                    ...joinedPlayer,
                    status: gameStatusRef.current === 'playing' ? 'playing' : 'waiting',
                });

                // Nếu ta là host, gửi lại danh sách player hiện tại cho người mới
                if (isHostRef.current) {
                    setTimeout(() => {
                        channel.send({
                            type: 'broadcast',
                            event: 'player_list_sync',
                            payload: {
                                players: playersRef.current,
                                gameStatus: gameStatusRef.current,
                            },
                        });
                    }, 500);
                }
            })
            .on('broadcast', { event: 'player_leave' }, ({ payload }) => {
                removePlayer(payload.name);
            })
            .on('broadcast', { event: 'player_list_sync' }, ({ payload }) => {
                // Chỉ nhận sync từ host (tránh conflict)
                const syncedPlayers = payload.players as Player[];
                const syncedGameStatus = payload.gameStatus as 'waiting' | 'playing' | 'ended';

                // ─── Anti-cheat: Nếu đã có host khác → tước quyền host ───
                const existingHost = syncedPlayers.find(p => p.isHost);
                if (existingHost && existingHost.name !== playerName && isHostRef.current) {
                    // Phòng đã có host chính thức → ta bị demote
                    setIsHost(false);
                    isHostRef.current = false;
                }

                // Cập nhật danh sách players
                setPlayers(syncedPlayers.map(p => ({ ...p, lastSeen: Date.now() })));

                // Đồng bộ game status
                if (syncedGameStatus && syncedGameStatus !== gameStatusRef.current) {
                    setGameStatus(syncedGameStatus);
                    gameStatusRef.current = syncedGameStatus;
                }
            })
            .on('broadcast', { event: 'room_full' }, ({ payload }) => {
                if (payload.targetPlayer === playerName) {
                    setIsRoomFull(true);
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
                setPlayers(prev => prev.map(p => ({
                    ...p,
                    isHost: p.name === newHostName,
                })));
            })

            // ─── Heartbeat (Host gửi, client nhận) ──────────
            .on('broadcast', { event: 'heartbeat' }, ({ payload }) => {
                const activeNames = payload.activePlayers as string[];
                // Cập nhật lastSeen cho active players
                setPlayers(prev => prev.map(p => ({
                    ...p,
                    lastSeen: activeNames.includes(p.name) ? Date.now() : p.lastSeen,
                })));
            })
            .on('broadcast', { event: 'heartbeat_ping' }, () => {
                // Client trả lời heartbeat - gửi pong
                channel.send({
                    type: 'broadcast',
                    event: 'heartbeat_pong',
                    payload: { name: playerName },
                });
            })

            // ─── Game Events (giữ nguyên) ────────────────────
            .on('broadcast', { event: 'game_start' }, () => {
                setGameStatus('playing');
                gameStatusRef.current = 'playing';
                setDrawnNumbers([]);
                setCurrentNumber(null);
                setWinner(null);
                setMarkedNumbers(new Set());
            })
            .on('broadcast', { event: 'game_reset' }, () => {
                handleReset();
            })
            .on('broadcast', { event: 'number_draw' }, ({ payload }) => {
                setDrawnNumbers(prev => [...prev, payload.number]);
                setCurrentNumber(payload.number);
            })
            .on('broadcast', { event: 'chat' }, ({ payload }) => {
                appendMessage(payload);
            })
            .on('broadcast', { event: 'player_win' }, ({ payload }) => {
                setWinner(payload.player);
                setGameStatus('ended');
                gameStatusRef.current = 'ended';
            })
            .on('broadcast', { event: 'waiting_kinh' }, ({ payload }) => {
                setWaitingKinhPlayer(payload.player);
                setTimeout(() => setWaitingKinhPlayer(null), 5000);
            });

        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                // Thêm bản thân vào danh sách local
                upsertPlayer(myPlayer);

                // Broadcast thông báo tham gia cho mọi người
                await channel.send({
                    type: 'broadcast',
                    event: 'player_join',
                    payload: { player: myPlayer },
                });
            }
        });

        return () => {
            // Thông báo rời phòng trước khi unsubscribe
            channel.send({
                type: 'broadcast',
                event: 'player_leave',
                payload: { name: playerName },
            });
            channel.unsubscribe();
            channelRef.current = null;
        };
    }, [roomId, playerName, upsertPlayer, removePlayer, appendMessage]);

    // ─── Host Heartbeat System ──────────────────────────────
    useEffect(() => {
        if (!isHost || !channelRef.current) {
            // Nếu không phải host, cleanup interval
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
                heartbeatIntervalRef.current = null;
            }
            return;
        }

        // Host: ping mọi client và thu thập pong responses
        const pongReceivedRef: Set<string> = new Set();

        const pongHandler = ({ payload }: { payload: { name: string } }) => {
            pongReceivedRef.add(payload.name);
        };

        // Listen for pong responses
        channelRef.current.on('broadcast', { event: 'heartbeat_pong' }, pongHandler);

        heartbeatIntervalRef.current = setInterval(() => {
            if (!channelRef.current) return;

            // Kiểm tra ai đã trả lời ping trước đó
            const currentPlayers = playersRef.current;
            const now = Date.now();

            // Xóa players không phản hồi quá lâu
            const activePlayers = currentPlayers.filter(p => {
                if (p.name === playerName) return true; // Host luôn active
                return pongReceivedRef.has(p.name) || (p.lastSeen && (now - p.lastSeen) < HEARTBEAT_TIMEOUT_MS);
            });

            if (activePlayers.length !== currentPlayers.length) {
                setPlayers(activePlayers);
            }

            // Gửi heartbeat broadcast
            channelRef.current.send({
                type: 'broadcast',
                event: 'heartbeat',
                payload: { activePlayers: activePlayers.map(p => p.name) },
            });

            // Gửi ping mới
            channelRef.current.send({
                type: 'broadcast',
                event: 'heartbeat_ping',
                payload: {},
            });

            // Reset pong tracker
            pongReceivedRef.clear();
            pongReceivedRef.add(playerName); // Host tự pong cho chính mình
        }, HEARTBEAT_INTERVAL_MS);

        return () => {
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
                heartbeatIntervalRef.current = null;
            }
        };
    }, [isHost, playerName]);

    // ─── Non-host: detect host offline & migrate ────────────
    useEffect(() => {
        if (isHost) return;

        const checkHostAlive = setInterval(() => {
            const currentPlayers = playersRef.current;
            const host = currentPlayers.find(p => p.isHost);
            if (!host) return;

            const now = Date.now();
            if (host.lastSeen && (now - host.lastSeen) > HEARTBEAT_TIMEOUT_MS) {
                // Host seems offline — nhận host nếu ta đứng đầu danh sách non-host
                const nonHostPlayers = currentPlayers
                    .filter(p => !p.isHost)
                    .sort((a, b) => a.name.localeCompare(b.name));

                if (nonHostPlayers.length > 0 && nonHostPlayers[0].name === playerName) {
                    // Ta là người đầu tiên → nhận host
                    setIsHost(true);
                    isHostRef.current = true;

                    // Xóa host cũ khỏi danh sách
                    removePlayer(host.name);

                    // Broadcast cho mọi người biết
                    channelRef.current?.send({
                        type: 'broadcast',
                        event: 'host_change',
                        payload: { newHost: playerName },
                    });
                }
            }
        }, HEARTBEAT_INTERVAL_MS);

        return () => clearInterval(checkHostAlive);
    }, [isHost, playerName, removePlayer]);

    // ─── Chat Cooldown Timer ────────────────────────────────
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
        channelRef.current?.send({
            type: 'broadcast',
            event: 'game_start',
            payload: {},
        });
        setGameStatus('playing');
        gameStatusRef.current = 'playing';
        setDrawnNumbers([]);
        setCurrentNumber(null);
        setWinner(null);

        // Cập nhật status cho tất cả players
        setPlayers(prev => prev.map(p => ({ ...p, status: 'playing' as const })));
    }, [isHost]);

    const drawNumber = useCallback((number: number) => {
        if (!isHost) return;
        channelRef.current?.send({
            type: 'broadcast',
            event: 'number_draw',
            payload: { number },
        });
        setDrawnNumbers(prev => [...prev, number]);
        setCurrentNumber(number);
    }, [isHost]);

    const sendMessage = useCallback((text: string) => {
        const now = Date.now();
        const timeSinceLast = now - lastMessageTimeRef.current;

        // ─── Throttle Check ─────────────────────────────
        if (timeSinceLast < CHAT_THROTTLE_MS) {
            const remaining = Math.ceil((CHAT_THROTTLE_MS - timeSinceLast) / 1000);
            setChatCooldown(remaining);

            // Countdown timer
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

            return false; // Không gửi được
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
        return true; // Gửi thành công
    }, [playerName, appendMessage]);

    const declareWin = useCallback(() => {
        const player: Player = { id: playerName, name: playerName, isHost, status: 'won' };
        channelRef.current?.send({
            type: 'broadcast',
            event: 'player_win',
            payload: { player },
        });
        setWinner(player);
        setGameStatus('ended');
        gameStatusRef.current = 'ended';
    }, [playerName, isHost]);

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
        // Locally reset for host (broadcast doesn't echo to sender)
        setGameStatus('waiting');
        gameStatusRef.current = 'waiting';
        setDrawnNumbers([]);
        setCurrentNumber(null);
        setWinner(null);
        setMarkedNumbers(new Set());
        setWaitingKinhPlayer(null);
        setMyTicket(generateTicket());
        setMessages([]); // Dọn dẹp chat khi reset
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
        isRoomFull,
        chatCooldown,
        startGame,
        drawNumber,
        sendMessage,
        declareWin,
        declareWaitingKinh,
        toggleMark,
        resetGame,
    };
};
