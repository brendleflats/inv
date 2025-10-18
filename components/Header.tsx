import React from 'react';
import { InventoryItem } from '../types';

interface HeaderProps {
  liquidatedValue: number;
  activeValue: number;
  targetGoal: number;
  itemCount: number;
  statusCounts: Record<InventoryItem['status'], number>;
}

const Header: React.FC<HeaderProps> = ({ liquidatedValue, activeValue, targetGoal, itemCount, statusCounts }) => {
  const progress = Math.min((liquidatedValue / targetGoal) * 100, 100);

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const StatusCounter: React.FC<{label: string, count: number, color: string}> = ({ label, count, color }) => (
    <div className="text-center p-2 bg-slate-700/20 rounded-lg">
        <p className={`text-2xl font-bold ${color}`}>{count || 0}</p>
        <p className="text-xs text-slate-400">{label}</p>
    </div>
  );

  return (
    <header className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tighter">
            Your Inventory
            </h1>
            <p className="text-slate-400">A summary of your liquidation progress.</p>
        </div>
        <div className="text-right flex-shrink-0">
            <p className="text-sm text-slate-400">Active Listing Value</p>
            <p className="text-2xl font-semibold text-white/80">{formatter.format(activeValue)}</p>
        </div>
      </div>
      
      <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4 backdrop-blur-sm space-y-4">
        <div>
            <div className="flex justify-between items-baseline mb-2">
            <span className="text-slate-300">Liquidation Progress</span>
            <span className="text-xs font-mono text-slate-400">Goal: {formatter.format(targetGoal)}</span>
            </div>
            <div className="flex items-center gap-4">
                <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden border border-slate-600">
                    <div 
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <span className="text-xl font-semibold text-white w-36 text-right">{formatter.format(liquidatedValue)}</span>
            </div>
        </div>
        <div className="border-t border-slate-700 my-4"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatusCounter label="Total Items" count={itemCount} color="text-cyan-300" />
            <StatusCounter label="Available" count={statusCounts.Available} color="text-slate-300" />
            <StatusCounter label="Listed" count={statusCounts.Listed} color="text-blue-400" />
            <StatusCounter label="Sold" count={statusCounts.Sold} color="text-green-400" />
        </div>
      </div>
    </header>
  );
};

export default Header;