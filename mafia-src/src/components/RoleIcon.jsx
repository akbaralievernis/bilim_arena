import React from 'react';
import { Crown, Swords, Pill, Search, Skull, Sparkles, Shield, House, Eye, Moon } from 'lucide-react';

/** Значки ролей (вместо эмодзи — одинаково выглядят на всех устройствах) */
const ICONS = {
  don: Crown,
  mafia: Swords,
  doctor: Pill,
  detective: Search,
  maniac: Skull,
  putana: Sparkles,
  bodyguard: Shield,
  citizen: House,
  spectator: Eye
};

export default function RoleIcon({ role, size = 20, ...rest }) {
  const Icon = ICONS[role] || Moon;
  return <Icon size={size} aria-hidden="true" {...rest} />;
}
