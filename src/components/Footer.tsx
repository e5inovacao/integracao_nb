import React from 'react';
import { Link } from 'react-router-dom';
import {
  Leaf,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Heart,
  Recycle,
  TreePine,
  Shield,
} from 'lucide-react';
import { COMPANY_INFO, SUSTAINABILITY_FEATURES } from '../constants';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: 'Início', href: '/' },
    { label: 'Catálogo', href: '/catalogo' },
    { label: 'Sobre Nós', href: '/sobre' },
    { label: 'Contato', href: '/contato' },
    { label: 'Sustentabilidade', href: '/sustentabilidade' },
  ];

  const supportLinks = [
    { label: 'Como Comprar', href: '/como-comprar' },
    { label: 'Política de Privacidade', href: '/privacidade' },
    { label: 'Termos de Uso', href: '/termos' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Suporte', href: '/suporte' },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Twitter, href: '#', label: 'Twitter' },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Leaf className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">{COMPANY_INFO.name}</h3>
                <p className="text-sm text-gray-400">{COMPANY_INFO.tagline}</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              {COMPANY_INFO.tagline}. Comprometidos com a sustentabilidade e
              responsabilidade ambiental em cada produto que oferecemos.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary transition-colors"
                    aria-label={social.label}
                  >
                    <IconComponent size={16} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Links Rápidos</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Suporte</h4>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contato</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone size={16} className="text-primary" />
                <span className="text-gray-300 text-sm">{COMPANY_INFO.phone}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail size={16} className="text-primary" />
                <span className="text-gray-300 text-sm">{COMPANY_INFO.email}</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin size={16} className="text-primary mt-0.5" />
                <span className="text-gray-300 text-sm">
                  São Paulo, SP<br />
                  Brasil
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sustainability Banner */}
      <div className="bg-primary/10 border-t border-gray-800">
        <div className="container-custom py-6">
          <div className="text-center mb-4">
            <h4 className="text-lg font-semibold text-primary mb-2">
              Compromisso com a Sustentabilidade
            </h4>
            <p className="text-gray-300 text-sm">
              Todos os nossos produtos seguem rigorosos padrões ambientais
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SUSTAINABILITY_FEATURES.map((feature) => {
              const getIcon = (iconName: string) => {
                const icons: Record<string, React.ComponentType<any>> = {
                  Leaf,
                  Recycle,
                  TreePine,
                  CloudSnow: Shield,
                };
                return icons[iconName] || Leaf;
              };
              const IconComponent = getIcon(feature.icon);
              
              return (
                <div
                  key={feature.id}
                  className="flex items-center space-x-2 text-sm"
                >
                  <IconComponent size={16} className="text-primary" />
                  <span className="text-gray-300">{feature.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-950 border-t border-gray-800">
        <div className="container-custom py-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>&copy; {currentYear} {COMPANY_INFO.name}.</span>
              <span>Todos os direitos reservados.</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>Feito com</span>
              <Heart size={14} className="text-red-500" />
              <span>para um mundo mais sustentável</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;