import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './SuggestedGiftsSection.css';
import { Product } from '../../shared/types';
import Card from './Card';
import Badge from './Badge';
import { Leaf } from 'lucide-react';

interface SuggestedGiftsSectionProps {
  suggestions: Product[];
}

export default function SuggestedGiftsSection({ suggestions }: SuggestedGiftsSectionProps) {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 2,
    arrows: true,
    autoplay: false,
    centerMode: false,
    variableWidth: false,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 2,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      }
    ]
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Sugestões de Brindes</h2>
      <div className="relative suggested-gifts-slider">
        <Slider {...settings}>
        {suggestions.map((product) => (
          <div key={product.id} className="px-2">
            <Card className="hover:shadow-lg transition-shadow">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                {product.isEcological && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <Leaf className="w-3 h-3" />
                    Ecológico
                  </Badge>
                )}
              </div>
            </Card>
          </div>
        ))}
        </Slider>
      </div>
    </div>
  );
}