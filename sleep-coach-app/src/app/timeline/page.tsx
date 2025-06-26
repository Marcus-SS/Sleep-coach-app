"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import BottomNav from '@/components/BottomNav';
import { MessageCircle } from 'lucide-react';

interface Shift {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

interface TimelineBlock {
  type: 'sleep' | 'work' | 'caffeine' | 'light' | 'no-caffeine' | 'no-light' | 'shift' | 'melatonin';
  startHour: number;
  endHour: number;
  color: string;
  icon: string;
  date: string;
  row: number; // Which row this block belongs to
  isShift?: boolean; // Special styling for shift blocks
  isCircle?: boolean; // Single circle instead of bar
}

export default function TimelinePage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchShifts = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/signin');
        return;
      }

      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching shifts:', error);
        return;
      }

      setShifts(data || []);
    };

    fetchShifts();
  }, [router]);

  const formatTime = (hour: number) => {
    if (hour === 0) return '12am';
    if (hour === 12) return '12pm';
    if (hour < 12) return `${hour}am`;
    return `${hour - 12}pm`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getDaysToShow = () => {
    const days = [];
    const today = new Date();
    
    // Show 7 days starting from today
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date.toISOString().split('T')[0]);
    }
    
    return days;
  };

  // Convert time string to hour number
  const timeToHour = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours + (minutes >= 30 ? 0.5 : 0); // Round to nearest half hour
  };

  // Generate placeholder timeline blocks for testing
  const getTimelineBlocks = (): TimelineBlock[] => {
    const blocks: TimelineBlock[] = [];
    const days = getDaysToShow();
    
    days.forEach(date => {
      // Melatonin recommendation - Row 1 (single circle)
      blocks.push({
        type: 'melatonin',
        startHour: 20, // 8pm
        endHour: 20, // Same hour for circle
        color: 'bg-purple-500',
        icon: '💊',
        date,
        row: 1,
        isCircle: true
      });

      // Sleep blocks (10pm to 6am next day) - Row 2
      blocks.push({
        type: 'sleep',
        startHour: 22,
        endHour: 30, // 6am next day (24 + 6)
        color: 'bg-slate-700',
        icon: '😴',
        date,
        row: 2
      });
      
      // Light exposure blocks - Row 3
      blocks.push({
        type: 'light',
        startHour: 6, // 6am
        endHour: 8, // 8am
        color: 'bg-yellow-400',
        icon: '☀️',
        date,
        row: 3
      });
      
      // No light blocks - Row 3
      blocks.push({
        type: 'no-light',
        startHour: 20, // 8pm
        endHour: 22, // 10pm
        color: 'bg-gray-400',
        icon: '🌙',
        date,
        row: 3
      });
      
      // Caffeine blocks - Row 4
      blocks.push({
        type: 'caffeine',
        startHour: 7, // 7am
        endHour: 14, // 2pm
        color: 'bg-amber-700',
        icon: '☕',
        date,
        row: 4
      });
      
      // No caffeine blocks - Row 4
      blocks.push({
        type: 'no-caffeine',
        startHour: 16, // 4pm
        endHour: 24, // midnight
        color: 'bg-pink-200',
        icon: '🚫',
        date,
        row: 4
      });

      // Add user shifts - Row 5
      const dayShifts = shifts.filter(shift => shift.date === date);
      dayShifts.forEach(shift => {
        const startHour = timeToHour(shift.start_time);
        const endHour = timeToHour(shift.end_time);
        
        blocks.push({
          type: 'shift',
          startHour: startHour,
          endHour: endHour > startHour ? endHour : endHour + 24, // Handle overnight shifts
          color: 'bg-gray-300',
          icon: '💼',
          date,
          row: 5,
          isShift: true
        });
      });
    });
    
    return blocks;
  };

  const timelineBlocks = getTimelineBlocks();
  const days = getDaysToShow();

  const getContinuousBlocks = (date: string) => {
    const dayBlocks: (TimelineBlock & { actualStartHour: number; actualEndHour: number })[] = [];
    
    // Get blocks that start on this date
    const currentDayBlocks = timelineBlocks.filter(block => block.date === date);
    
    // Get blocks from previous day that extend into this day
    const prevDate = new Date(date + 'T00:00:00');
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().split('T')[0];
    const prevDayBlocks = timelineBlocks.filter(block => 
      block.date === prevDateStr && block.endHour > 24
    );
    
    // Process current day blocks
    currentDayBlocks.forEach(block => {
      if (block.endHour <= 24) {
        // Block stays within current day
        dayBlocks.push({
          ...block,
          actualStartHour: block.startHour,
          actualEndHour: block.endHour
        });
      } else {
        // Block extends to next day - only show current day portion
        dayBlocks.push({
          ...block,
          actualStartHour: block.startHour,
          actualEndHour: 24
        });
      }
    });
    
    // Process previous day blocks that extend into current day
    prevDayBlocks.forEach(block => {
      dayBlocks.push({
        ...block,
        actualStartHour: 0,
        actualEndHour: block.endHour - 24
      });
    });
    
    return dayBlocks;
  };

  const HOUR_HEIGHT = 40; // Height of each hour row in pixels
  const ROW_SPACING = 60; // Equal spacing between all elements (edge to row 1, row to row, row 5 to edge)
  const TOTAL_ROWS = 5;

  const getRowPosition = (rowNumber: number) => {
    // Calculate the total content width (from first row to last row)
    const contentWidth = (TOTAL_ROWS - 1) * ROW_SPACING;
    
    // Calculate available space in the center area (between left and right time labels)
    // Assuming time labels take ~48px each (w-12 = 3rem = 48px) plus padding
    const timeLabelsWidth = 48 + 48 + 16; // left + right + padding
    const availableWidth = `calc(100% - ${timeLabelsWidth}px)`;
    
    // Start position: center the content within available space
    const startPosition = `calc(50% - ${contentWidth / 2}px)`;
    const offset = (rowNumber - 1) * ROW_SPACING;
    
    return `calc(${startPosition} + ${offset}px)`;
  };

  return (
    <div className="min-h-screen pb-20" style={{
      background: 'linear-gradient(135deg, #843484 0%, #47154f 100%)'
    }}>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 px-4 pt-6 pb-4" style={{
          background: 'linear-gradient(135deg, #843484 0%, #47154f 100%)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-white">
              📅 Sleep Timeline
            </h1>
            <button className="p-2 rounded-full bg-white bg-opacity-20">
              <MessageCircle size={20} className="text-white" />
            </button>
          </div>
          <p className="text-purple-200 text-sm">
            Hourly sleep optimization recommendations
          </p>
        </div>

        {/* Continuous Timeline */}
        <div className="px-4">
          {days.map((date, dayIndex) => {
            const continuousBlocks = getContinuousBlocks(date);
            
            return (
              <div key={date} className="mb-8 last:mb-20">
                {/* Day Header */}
                <div className="sticky top-24 z-10 mb-4">
                  <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-full px-4 py-2 text-center border border-white border-opacity-30">
                    <span className="font-semibold text-gray-800">{formatDate(date)}</span>
                  </div>
                </div>

                {/* Hours for this day */}
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-[20px] border border-white border-opacity-30 overflow-hidden relative">
                  {/* Continuous bars and circles positioned absolutely */}
                  {continuousBlocks.map((block, blockIndex) => {
                    const topPosition = block.actualStartHour * HOUR_HEIGHT;
                    const height = block.isCircle ? 48 : (block.actualEndHour - block.actualStartHour) * HOUR_HEIGHT;
                    const width = block.isCircle ? 48 : (block.isShift ? 24 : 48);
                    const isFirstInBlock = block.actualStartHour === (block.startHour > 24 ? 0 : block.startHour);
                    const leftPosition = getRowPosition(block.row);
                    
                    return (
                      <div
                        key={blockIndex}
                        className={`absolute ${block.color} rounded-full shadow-sm flex items-center justify-center z-10 ${
                          block.isShift ? 'opacity-70' : ''
                        }`}
                        style={{
                          top: block.isCircle ? `${topPosition + (HOUR_HEIGHT - 48) / 2}px` : `${topPosition}px`,
                          height: `${height}px`,
                          width: `${width}px`,
                          left: leftPosition,
                          transform: 'translateX(-50%)',
                        }}
                      >
                        {/* Show icon for circles or at the start of bars */}
                        {(block.isCircle || isFirstInBlock) && (
                          <span className={`text-white ${block.isShift ? 'text-xs' : 'text-xs'}`}>
                            {block.icon}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Hour rows */}
                  {Array.from({ length: 24 }, (_, hour) => (
                    <div 
                      key={hour} 
                      className="flex items-center border-b border-white border-opacity-10 last:border-b-0 relative"
                      style={{ height: `${HOUR_HEIGHT}px` }}
                    >
                      {/* Left time */}
                      <div className="w-12 text-xs text-white text-right pr-2 opacity-60">
                        {formatTime(hour)}
                      </div>
                      
                      {/* Center content area with row guides */}
                      <div className="flex-1 px-4 py-2 relative">
                        {/* Row guide lines */}
                        {Array.from({ length: TOTAL_ROWS }, (_, rowIndex) => (
                          <div
                            key={rowIndex}
                            className="absolute top-0 bottom-0 border-l border-white border-opacity-5"
                            style={{ left: getRowPosition(rowIndex + 1) }}
                          />
                        ))}
                        
                        {/* Hour line */}
                        <div className="absolute left-0 right-0 top-1/2 border-t border-white border-opacity-20 -translate-y-1/2"></div>
                      </div>
                      
                      {/* Right time */}
                      <div className="w-12 text-xs text-white text-left pl-2 opacity-60">
                        {formatTime(hour)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
} 