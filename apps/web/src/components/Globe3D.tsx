'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

interface Point {
  lat: number;
  lng: number;
  name: string;
  type: 'china' | 'africa';
}

interface Arc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
  direction: 'toAfrica' | 'toChina';
}

interface Particle {
  lat: number;
  lng: number;
  color: string;
  size: number;
  altitude: number;
  direction: 'toAfrica' | 'toChina';
}

const CHINA_POINT: Point = {
  lat: 39.9042,
  lng: 116.4074,
  name: 'Beijing, China',
  type: 'china',
};

const AFRICAN_CITIES: Point[] = [
  { lat: -1.2921, lng: 36.8219, name: 'Nairobi, Kenya', type: 'africa' },
  { lat: 6.5244, lng: 3.3792, name: 'Lagos, Nigeria', type: 'africa' },
  { lat: -26.2041, lng: 28.0473, name: 'Johannesburg, South Africa', type: 'africa' },
  { lat: 8.9806, lng: 38.7575, name: 'Addis Ababa, Ethiopia', type: 'africa' },
  { lat: 5.6037, lng: -0.1870, name: 'Accra, Ghana', type: 'africa' },
  { lat: -6.7924, lng: 39.2083, name: 'Dar es Salaam, Tanzania', type: 'africa' },
  { lat: 0.3476, lng: 32.5825, name: 'Kampala, Uganda', type: 'africa' },
];

const COLORS = {
  toAfrica: '#FFD700', // Gold for China → Africa
  toChina: '#10B981',   // Green for Africa → China
};

function getRandomAfricanCity() {
  return AFRICAN_CITIES[Math.floor(Math.random() * AFRICAN_CITIES.length)];
}

export default function Globe3D() {
  const globeRef = useRef<any>(null);
  const [width, setWidth] = useState(600);
  const [height, setHeight] = useState(600);
  const [isClient, setIsClient] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [arcs, setArcs] = useState<Arc[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const updateSize = () => {
      const containerWidth = window.innerWidth;
      if (containerWidth < 768) {
        setWidth(containerWidth);
        setHeight(containerWidth);
      } else {
        setWidth(Math.min(containerWidth * 0.65, 700));
        setHeight(Math.min(containerWidth * 0.65, 700));
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const generateParticles = () => {
      const newParticles: Particle[] = [];
      const isMobile = width < 768;
      const particleCount = isMobile ? 60 : 120;

      for (let i = 0; i < particleCount; i++) {
        // Balanced: 50% to Africa, 50% to China
        const isGoingToAfrica = Math.random() > 0.5;
        const direction = isGoingToAfrica ? 'toAfrica' : 'toChina';
        
        if (isGoingToAfrica) {
          // Particles starting from China going to Africa
          newParticles.push({
            lat: CHINA_POINT.lat + (Math.random() - 0.5) * 15,
            lng: CHINA_POINT.lng + (Math.random() - 0.5) * 15,
            color: COLORS.toAfrica,
            size: 0.3 + Math.random() * 0.5,
            altitude: 0.15 + Math.random() * 0.25,
            direction,
          });
        } else {
          // Particles starting from Africa going to China
          const africanCity = getRandomAfricanCity();
          newParticles.push({
            lat: africanCity.lat + (Math.random() - 0.5) * 10,
            lng: africanCity.lng + (Math.random() - 0.5) * 10,
            color: COLORS.toChina,
            size: 0.3 + Math.random() * 0.5,
            altitude: 0.15 + Math.random() * 0.25,
            direction,
          });
        }
      }
      return newParticles;
    };

    const generateArcs = () => {
      const newArcs: Arc[] = [];
      const isMobile = width < 768;
      const arcCount = isMobile ? 12 : 24;

      for (let i = 0; i < arcCount; i++) {
        const africanCity = getRandomAfricanCity();
        // Balanced: 50% to Africa, 50% to China
        const isGoingToAfrica = Math.random() > 0.5;
        
        if (isGoingToAfrica) {
          // China → Africa
          newArcs.push({
            startLat: CHINA_POINT.lat,
            startLng: CHINA_POINT.lng,
            endLat: africanCity.lat,
            endLng: africanCity.lng,
            color: COLORS.toAfrica,
            direction: 'toAfrica',
          });
        } else {
          // Africa → China
          newArcs.push({
            startLat: africanCity.lat,
            startLng: africanCity.lng,
            endLat: CHINA_POINT.lat,
            endLng: CHINA_POINT.lng,
            color: COLORS.toChina,
            direction: 'toChina',
          });
        }
      }
      return newArcs;
    };

    setParticles(generateParticles());
    setArcs(generateArcs());

    let frameCount = 0;
    const animate = () => {
      frameCount++;
      
      if (frameCount % 8 === 0) {
        setParticles(generateParticles());
      }
      
      if (frameCount % 50 === 0) {
        setArcs(generateArcs());
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isClient, width]);

  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 200;
      controls.maxDistance = 500;
    }
  }, [isClient]);

  const handlePointHover = useCallback((point: Point | null | object) => {
    setHoveredPoint(point as Point | null);
  }, []);

  const handleGlobeClick = useCallback(() => {
    setIsInteracting(true);
    setTimeout(() => setIsInteracting(false), 2000);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse bg-gray-200 rounded-full w-64 h-64" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Globe
        ref={globeRef}
        width={width}
        height={height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        
        pointsData={[CHINA_POINT, ...AFRICAN_CITIES]}
        pointLat="lat"
        pointLng="lng"
        pointColor={(point) => (point as Point).type === 'china' ? '#FF4444' : '#10B981'}
        pointAltitude={0.05}
        pointRadius="0.5"
        pointLabel={(point) => {
          const p = point as Point;
          return `
          <div class="bg-black/80 text-white px-3 py-2 rounded-lg text-sm">
            <strong>${p.name}</strong>
            <br/>
            <span class="text-xs">${p.type === 'china' ? '🇨🇳 China Hub' : '🌍 Africa Hub'}</span>
          </div>
        `;
        }}
        onPointHover={handlePointHover as (point: object | null, prevPoint: object | null) => void}
        
        arcsData={arcs}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcAltitude={0.3}
        arcStroke={0.8}
        arcDashLength={0.6}
        arcDashGap={0.3}
        arcDashAnimateTime={2000}
        
        particlesData={particles}
        particleLat="lat"
        particleLng="lng"
        particlesColor="color"
        particleAltitude="altitude"
        particlesSize="size"
        
        onGlobeClick={handleGlobeClick}
        
        enablePointerInteraction={true}
        
        atmosphereColor="#3B82F6"
        atmosphereAltitude={0.15}
      />
      
      {/* Tooltip */}
      {hoveredPoint && (
        <div 
          className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm pointer-events-none z-10 whitespace-nowrap"
          style={{ backdropFilter: 'blur(10px)' }}
        >
          <strong className="text-lg">{hoveredPoint.name}</strong>
          <br />
          <span className="text-xs opacity-80">
            {hoveredPoint.type === 'china' 
              ? '🇨🇳 China Hub - Bidirectional trade' 
              : '🌍 Africa Hub - Bidirectional trade'}
          </span>
        </div>
      )}

      {/* Legend - Bidirectional */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white text-xs z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <span>China → Africa (On-ramp)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Africa → China (Off-ramp)</span>
        </div>
      </div>

      {/* Trade volume indicator */}
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white text-xs z-10">
        <p className="font-semibold mb-1">Active Routes</p>
        <p className="text-yellow-400">• China to Africa</p>
        <p className="text-green-500">• Africa to China</p>
      </div>

      {/* Interaction hint */}
      {!isInteracting && (
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-2 text-white text-xs z-10">
          <span className="animate-pulse">🖱️ Drag to rotate</span>
        </div>
      )}
    </div>
  );
}
