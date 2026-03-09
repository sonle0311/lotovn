# Plan: Hoàn Thiện Lobby
Created: 2026-03-09
Status: 🟡 In Progress

## Overview
Lobby hiện có UI + API nhưng **không kết nối end-to-end**. Host không toggle public được, player count luôn = 0, không auto-refresh. Plan này fix tất cả gaps để Lobby hoạt động hoàn chỉnh.

## Tech Stack
- Frontend: Next.js + React + Framer Motion
- Backend: Supabase (Realtime + Database)
- i18n: Custom t() system

## Phases

| Phase | Name | Status | Tasks | Estimate |
|-------|------|--------|-------|----------|
| 01 | DB Migration Check | ⬜ Pending | 2 | 15m |
| 02 | Host Public Toggle | ⬜ Pending | 5 | 45m |
| 03 | Player Count Sync | ⬜ Pending | 3 | 20m |
| 04 | Lobby Auto-Refresh & Status | ⬜ Pending | 4 | 30m |
| 05 | Landing → Lobby Link | ⬜ Pending | 2 | 15m |
| 06 | i18n + Polish | ⬜ Pending | 3 | 20m |
| 07 | Testing | ⬜ Pending | 3 | 15m |

**Tổng:** 22 tasks | ~2.5 giờ

## Quick Commands
- Start: `/code phase-01`
- Check progress: `/next`
- Save context: `/save-brain`
