import React from 'react';
import {
  Tag, Briefcase, Building2, Landmark, Receipt, Wallet, Banknote, Truck, Wrench, Zap,
  Wifi, Plane, Stethoscope, Gift, ShoppingBag, Users, BookOpen, Shield, Utensils, Globe, Package,
  Handshake, Repeat, Coins,
} from 'lucide-react';

// Icones minimalistes (lucide) proposees pour les categories personnalisees.
// La categorie stocke la cle (ex: "Briefcase"). Les anciennes categories qui
// ont un emoji stocke restent affichees telles quelles (voir CustomCatIcon).
export const CUSTOM_CAT_ICONS = {
  Tag, Briefcase, Building2, Landmark, Receipt, Wallet, Banknote, Truck, Wrench, Zap,
  Wifi, Plane, Stethoscope, Gift, ShoppingBag, Users, BookOpen, Shield, Utensils, Globe,
  Handshake, Repeat, Coins,
};
export const CUSTOM_CAT_ICON_KEYS = Object.keys(CUSTOM_CAT_ICONS);

export function CustomCatIcon({ icon, size = 14, style }) {
  const Lucide = CUSTOM_CAT_ICONS[icon];
  if (Lucide) return <Lucide size={size} style={style} />;
  if (icon) return <span style={{ fontSize: size, lineHeight: 1, ...style }}>{icon}</span>; // ancien emoji
  return <Package size={size} style={style} />;
}
