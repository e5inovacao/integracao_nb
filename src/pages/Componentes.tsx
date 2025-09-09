import React from 'react';
import SuggestedGiftsSection from '../components/SuggestedGiftsSection';
import { Product } from '../../shared/types';

const mockSuggestions: Product[] = [
  {
    id: '1',
    name: 'Caneta Ecológica',
    description: 'Caneta feita de material reciclado.',
    price: 15.90,
    category: 'ecologicos',
    images: ['https://via.placeholder.com/300x200?text=Caneta+Ecologica'],
    sustainabilityFeatures: ['reciclado', 'sustentavel'],
    customizationOptions: [],
    inStock: true,
    featured: false,
    isEcological: true,
  },
  {
    id: '2',
    name: 'Copo Reutilizável',
    description: 'Copo sustentável para uso diário.',
    price: 25.50,
    category: 'ecologicos',
    images: ['https://via.placeholder.com/300x200?text=Copo+Reutilizavel'],
    sustainabilityFeatures: ['reusable', 'sustentavel'],
    customizationOptions: [],
    inStock: true,
    featured: false,
    isEcological: true,
  },
  {
    id: '3',
    name: 'Bolsa de Tecido',
    description: 'Bolsa ecológica feita de algodão orgânico.',
    price: 35.00,
    category: 'ecologicos',
    images: ['https://via.placeholder.com/300x200?text=Bolsa+de+Tecido'],
    sustainabilityFeatures: ['organic', 'sustentavel'],
    customizationOptions: [],
    inStock: true,
    featured: false,
    isEcological: true,
  },
  {
    id: '4',
    name: 'Caderno Reciclado',
    description: 'Caderno com folhas de papel reciclado.',
    price: 18.75,
    category: 'ecologicos',
    images: ['https://via.placeholder.com/300x200?text=Caderno+Reciclado'],
    sustainabilityFeatures: ['reciclado', 'sustentavel'],
    customizationOptions: [],
    inStock: true,
    featured: false,
    isEcological: true,
  },
  {
    id: '5',
    name: 'Garrafa Térmica',
    description: 'Garrafa reutilizável para manter bebidas quentes ou frias.',
    price: 45.90,
    category: 'casa-escritorio',
    images: ['https://via.placeholder.com/300x200?text=Garrafa+Termica'],
    sustainabilityFeatures: ['reusable', 'durable'],
    customizationOptions: [],
    inStock: true,
    featured: false,
    isEcological: false,
  },
];

export default function Componentes() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Página de Componentes</h1>
      <SuggestedGiftsSection suggestions={mockSuggestions} />
    </div>
  );
}