import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SliderContext } from './NetflixContext';
import './NetflixSlider.css';

interface Props {
  link: string;
}

const NetflixViewAllItem: React.FC<Props> = ({ link }) => {
  const context = useContext(SliderContext);
  if (!context) return null;
  const { elementRef } = context;

  return (
    <div ref={elementRef as any} className="netflix-item netflix-item-view-all">
      <Link to={link} className="bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-colors rounded-md group">
        <div className="rounded-full bg-white/10 p-3 mb-2 group-hover:bg-white/20 transition-colors">
          <ChevronRight size={32} className="text-white" />
        </div>
        <span className="text-white font-bold text-sm md:text-base">Xem tất cả</span>
      </Link>
    </div>
  );
};

export default NetflixViewAllItem;
