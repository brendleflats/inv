import React, { useEffect, useRef } from 'react';

const Confetti: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: Particle[] = [];
    const colors = ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#ec4899', '#f472b6', '#f9a8d4'];

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      opacity: number;
      spin: number;
      spinSpeed: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * -height;
        this.size = Math.random() * 8 + 4;
        this.speedX = Math.random() * 4 - 2;
        this.speedY = Math.random() * 5 + 2;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.opacity = 1;
        this.spin = Math.random() * Math.PI * 2;
        this.spinSpeed = Math.random() * 0.1 - 0.05;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.spin += this.spinSpeed;
        if (this.y > height) {
          this.y = -this.size;
          this.x = Math.random() * width;
        }
      }

      draw() {
        ctx!.save();
        ctx!.globalAlpha = this.opacity;
        ctx!.fillStyle = this.color;
        ctx!.translate(this.x, this.y);
        ctx!.rotate(this.spin);
        ctx!.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 1.5);
        ctx!.restore();
      }
    }

    const createParticles = () => {
      for (let i = 0; i < 300; i++) {
        particles.push(new Particle());
      }
    };

    let animationFrameId: number;
    const animate = () => {
      ctx!.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    createParticles();
    animate();
    
    window.addEventListener('resize', handleResize);

    // Stop animation after some time
    const timer = setTimeout(() => {
        cancelAnimationFrame(animationFrameId);
    }, 8000);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
};

export default Confetti;
