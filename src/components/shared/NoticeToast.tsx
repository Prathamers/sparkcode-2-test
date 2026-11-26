// SPDX-License-Identifier: AGPL-3.0-or-later
import React from 'react';

export interface NoticeState {
  kind: 'info' | 'error';
  text: string;
}

export const NoticeToast: React.FC<{ notice: NoticeState | null }> = ({ notice }) => {
  if (!notice) return null;
  return (
    <div
      role="status"
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-3.5 py-2 rounded-md border text-xs font-medium shadow-lg ${
        notice.kind === 'error'
          ? 'bg-rose-950/95 border-rose-500/60 text-rose-100'
          : 'bg-slate-900/95 border-sky-500/50 text-sky-100'
      }`}
    >
      {notice.text}
    </div>
  );
};
