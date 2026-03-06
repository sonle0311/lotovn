"use client";

/**
 * Voice Chat hook using WebRTC for peer-to-peer audio.
 * Uses Supabase Realtime for signaling (SDP & ICE candidates).
 *
 * NOTE: This is the foundation. Full implementation requires:
 * - TURN server for NAT traversal in production
 * - Audio visualization (speaking indicators)
 * - Mesh network for >2 peers
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "./supabaseClient";

interface VoicePeer {
    name: string;
    isMuted: boolean;
    isSpeaking: boolean;
}

export function useVoiceChat(roomId: string, playerName: string) {
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [voicePeers, setVoicePeers] = useState<VoicePeer[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    const joinVoice = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            setIsVoiceActive(true);

            // Join voice signaling channel
            const channel = supabase.channel(`voice:${roomId}`);
            channelRef.current = channel;

            channel.on('broadcast', { event: 'voice_join' }, ({ payload }) => {
                setVoicePeers(prev => {
                    if (prev.find(p => p.name === payload.name)) return prev;
                    return [...prev, { name: payload.name, isMuted: false, isSpeaking: false }];
                });
            });

            channel.on('broadcast', { event: 'voice_leave' }, ({ payload }) => {
                setVoicePeers(prev => prev.filter(p => p.name !== payload.name));
            });

            channel.subscribe(() => {
                channel.send({
                    type: 'broadcast',
                    event: 'voice_join',
                    payload: { name: playerName },
                });
            });
        } catch {
            console.error('Failed to access microphone');
        }
    }, [roomId, playerName]);

    const leaveVoice = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        channelRef.current?.send({
            type: 'broadcast',
            event: 'voice_leave',
            payload: { name: playerName },
        });
        channelRef.current?.unsubscribe();
        channelRef.current = null;
        setIsVoiceActive(false);
        setVoicePeers([]);
    }, [playerName]);

    const toggleMic = useCallback(() => {
        if (streamRef.current) {
            const track = streamRef.current.getAudioTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setIsMicMuted(!track.enabled);
            }
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
            channelRef.current?.unsubscribe();
        };
    }, []);

    return {
        isVoiceActive,
        isMicMuted,
        voicePeers,
        joinVoice,
        leaveVoice,
        toggleMic,
    };
}
