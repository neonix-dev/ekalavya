'use client';

import { MidiConnectionStatus, MidiDeviceInfo } from '@/types/music';

interface ConnectionStatusProps {
  status: MidiConnectionStatus;
  deviceInfo: MidiDeviceInfo | null;
}

export function ConnectionStatus({ status, deviceInfo }: ConnectionStatusProps) {
  const text = () => {
    switch (status) {
      case 'unsupported': return 'Unsupported Browser \u2014 Use Chrome or Edge';
      case 'waiting': return 'Waiting for MIDI device\u2026';
      case 'connected': return `Connected: ${deviceInfo?.name ?? 'Unknown'}`;
      case 'disconnected': return 'Disconnected \u2014 reconnect device';
    }
  };

  const color = () => {
    switch (status) {
      case 'connected': return 'text-emerald-600';
      case 'unsupported':
      case 'disconnected': return 'text-red-400/70';
      default: return 'text-stone-500';
    }
  };

  return (
    <div className={`text-center text-[0.65rem] tracking-[0.2em] uppercase ${color()}`}>
      {text()}
    </div>
  );
}
