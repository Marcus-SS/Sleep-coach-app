"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import BottomNav from '@/components/BottomNav';
import UserPreferences from '@/components/UserPreferences';
import { Plus, Edit, Trash2, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface Shift {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

export default function ShiftManagerPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [shiftToEdit, setShiftToEdit] = useState<Shift | null>(null);
  const [shiftToDelete, setShiftToDelete] = useState<Shift | null>(null);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [hasPreferences, setHasPreferences] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    dates: [] as string[],
    start_hour: 9,
    start_minute: 0,
    end_hour: 17,
    end_minute: 0,
    end_day_offset: 0 // 0 = same day, 1 = next day, 2 = +2 days
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [calendarDate, setCalendarDate] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/signin');
        return;
      }

      // Check if user has preferences
      const { data: preferencesData } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      const userHasPreferences = !!preferencesData;
      setHasPreferences(userHasPreferences);

      // If no preferences, show the modal
      if (!userHasPreferences) {
        setShowPreferencesModal(true);
      }

      // Fetch shifts
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching shifts:', error);
        return;
      }

      setShifts(data || []);
    };

    fetchData();
  }, [router]);

  const resetForm = () => {
    setFormData({ 
      dates: [], 
      start_hour: 9, 
      start_minute: 0, 
      end_hour: 17, 
      end_minute: 0, 
      end_day_offset: 0 
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    if (!formData.dates || formData.dates.length === 0) {
      errors.dates = 'At least one date is required';
    }

    // Convert hours and minutes to total minutes for comparison
    const startTotalMinutes = formData.start_hour * 60 + formData.start_minute;
    const endTotalMinutes = formData.end_hour * 60 + formData.end_minute;

    // If same day and end time is before start time, that's an error
    if (formData.end_day_offset === 0 && endTotalMinutes <= startTotalMinutes) {
      errors.end_time = 'End time must be after start time on the same day';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddShift = async () => {
    if (!validateForm()) return;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/signin');
      return;
    }

    try {
      // Convert hours/minutes to time strings
      const startTime = `${formData.start_hour.toString().padStart(2, '0')}:${formData.start_minute.toString().padStart(2, '0')}`;
      const endTime = `${formData.end_hour.toString().padStart(2, '0')}:${formData.end_minute.toString().padStart(2, '0')}`;

      // Create shifts for all selected dates
      const shiftsToInsert = formData.dates.map(date => ({
        user_id: session.user.id,
        date: date,
        start_time: startTime,
        end_time: endTime,
        created_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('shifts')
        .insert(shiftsToInsert)
        .select();

      if (error) {
        alert(`Failed to add shift: ${error.message}`);
        return;
      }

      if (data && data.length > 0) {
        setShifts(prevShifts => [...prevShifts, ...data].sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return dateCompare;
          return a.start_time.localeCompare(b.start_time);
        }));
      }

      setShowAddModal(false);
      resetForm();
    } catch (err) {
      alert(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleEditClick = (shift: Shift, event: React.MouseEvent) => {
    event.stopPropagation();
    setShiftToEdit(shift);
    
    // Parse time strings back to hours/minutes
    const [startHour, startMinute] = shift.start_time.split(':').map(Number);
    const [endHour, endMinute] = shift.end_time.split(':').map(Number);
    
    setFormData({
      dates: [shift.date],
      start_hour: startHour,
      start_minute: startMinute,
      end_hour: endHour,
      end_minute: endMinute,
      end_day_offset: 0 // Default to same day for editing
    });
    setShowEditModal(true);
  };

  const handleUpdateShift = async () => {
    if (!validateForm() || !shiftToEdit) return;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/signin');
      return;
    }

    try {
      // Convert hours/minutes to time strings
      const startTime = `${formData.start_hour.toString().padStart(2, '0')}:${formData.start_minute.toString().padStart(2, '0')}`;
      const endTime = `${formData.end_hour.toString().padStart(2, '0')}:${formData.end_minute.toString().padStart(2, '0')}`;

      const { data, error } = await supabase
        .from('shifts')
        .update({
          date: formData.dates[0], // For edit, use the first (and only) selected date
          start_time: startTime,
          end_time: endTime
        })
        .eq('id', shiftToEdit.id)
        .select();

      if (error) {
        alert(`Failed to update shift: ${error.message}`);
        return;
      }

      if (data && data.length > 0) {
        setShifts(prevShifts => 
          prevShifts.map(shift => 
            shift.id === shiftToEdit.id ? data[0] : shift
          ).sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.start_time.localeCompare(b.start_time);
          })
        );
      }

      setShowEditModal(false);
      setShiftToEdit(null);
      resetForm();
    } catch (err) {
      alert(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDeleteClick = (shift: Shift, event: React.MouseEvent) => {
    event.stopPropagation();
    setShiftToDelete(shift);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!shiftToDelete) return;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/signin');
      return;
    }

    try {
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', shiftToDelete.id);

      if (error) {
        alert(`Failed to delete shift: ${error.message}`);
        return;
      }

      setShifts(prevShifts => prevShifts.filter(shift => shift.id !== shiftToDelete.id));
      setShowDeleteModal(false);
      setShiftToDelete(null);
    } catch (err) {
      alert(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      const hour12 = parseInt(hours) % 12 || 12;
      const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleDateClick = (day: number) => {
    // Fix timezone issue by using UTC methods
    const selectedDate = new Date(Date.UTC(calendarDate.getFullYear(), calendarDate.getMonth(), day));
    const dateString = selectedDate.toISOString().split('T')[0];
    
    setFormData(prev => {
      const currentDates = prev.dates || [];
      const isAlreadySelected = currentDates.includes(dateString);
      
      if (isAlreadySelected) {
        // Remove date if already selected
        return { ...prev, dates: currentDates.filter(d => d !== dateString) };
      } else {
        // Add date if not selected
        return { ...prev, dates: [...currentDates, dateString] };
      }
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCalendarDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isDateSelected = (day: number) => {
    if (!formData.dates || formData.dates.length === 0) return false;
    const currentDate = new Date(Date.UTC(calendarDate.getFullYear(), calendarDate.getMonth(), day));
    const dateString = currentDate.toISOString().split('T')[0];
    return formData.dates.includes(dateString);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarDate);
    const firstDay = getFirstDayOfMonth(calendarDate);
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-8 w-8"></div>
      );
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = isDateSelected(day);
      const isToday = new Date().toDateString() === new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day).toDateString();
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
            isSelected
              ? 'bg-[#843484] text-white'
              : isToday
              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };

  const renderCalendarView = () => {
    // Start from yesterday
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 1); // Start from yesterday
    
    // Calculate end date: one month after the latest shift, or 30 days from today if no shifts
    let endDate = new Date(today);
    endDate.setDate(today.getDate() + 30); // Default to 30 days from today
    
    if (shifts.length > 0) {
      // Find the latest shift date
      const latestShiftDate = shifts.reduce((latest, shift) => {
        const shiftDate = new Date(shift.date);
        return shiftDate > latest ? shiftDate : latest;
      }, new Date(shifts[0].date));
      
      // Set end date to one month after the latest shift
      const oneMonthAfterLatest = new Date(latestShiftDate);
      oneMonthAfterLatest.setMonth(latestShiftDate.getMonth() + 1);
      
      // Use the later of: one month after latest shift, or 30 days from today
      endDate = oneMonthAfterLatest > endDate ? oneMonthAfterLatest : endDate;
    }
    
    // Generate days from start date to end date
    const daysToShow: Date[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      daysToShow.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (shifts.length === 0) {
      return (
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-30 text-center">
          <Calendar size={48} className="mx-auto mb-4 text-white opacity-60" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No Shifts Yet
          </h3>
          <p className="text-purple-100 text-sm">
            Add your first work shift to get started with sleep optimization.
          </p>
        </div>
      );
    }

    // Helper function to check if a shift spans multiple days
    const getShiftEndDate = (shift: Shift) => {
      const startDate = new Date(shift.date);
      const [startHour] = shift.start_time.split(':').map(Number);
      const [endHour] = shift.end_time.split(':').map(Number);
      
      // If end time is earlier than start time, or if we have day offset info
      // we need to calculate the actual end date
      if (endHour < startHour) {
        // Shift goes to next day
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        return endDate.toISOString().split('T')[0];
      }
      
      return shift.date;
    };

    const isShiftCrossingDays = (shift: Shift) => {
      return getShiftEndDate(shift) !== shift.date;
    };

    // Get cross-day shifts that should appear between days
    const getCrossDayShifts = (currentDate: Date, nextDate: Date) => {
      const currentDateString = currentDate.toISOString().split('T')[0];
      const nextDateString = nextDate.toISOString().split('T')[0];
      
      return shifts.filter(shift => {
        const shiftStartDate = shift.date;
        const shiftEndDate = getShiftEndDate(shift);
        
        return (shiftStartDate === currentDateString && shiftEndDate === nextDateString);
      });
    };

    const elements: React.ReactElement[] = [];

    // Render continuous calendar
    daysToShow.forEach((date, index) => {
      const dateString = date.toISOString().split('T')[0];
      const dayShifts = shifts.filter(shift => 
        shift.date === dateString && !isShiftCrossingDays(shift)
      );
      
      // Check if this day has any shifts (including cross-day shifts that start on this day)
      const hasShifts = dayShifts.length > 0 || shifts.some(shift => 
        shift.date === dateString && isShiftCrossingDays(shift)
      );
      
      const isToday = date.toDateString() === new Date().toDateString();
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const dayNumber = date.getDate();
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const isFirstDay = index === 0;

      // Add day section
      elements.push(
        <div key={dateString} className="relative">
          {/* Day Header with Shifts */}
          <div className={`px-4 py-3 ${
            isToday 
              ? 'bg-[#843484] text-white' 
              : hasShifts 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-50 text-gray-700'
          } ${isFirstDay ? 'rounded-t-xl' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-sm font-medium opacity-80">{dayName}</div>
                  <div className="text-lg font-bold">{monthName} {dayNumber}</div>
                </div>
                
                {/* Shifts displayed inline with day info */}
                {dayShifts.length > 0 && (
                  <div className="flex gap-2">
                    {dayShifts.map((shift) => (
                      <div
                        key={shift.id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#843484] rounded-lg hover:bg-[#6b2d6b] transition-colors group"
                      >
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        <div className="text-white text-sm font-medium">
                          {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleEditClick(shift, e)}
                            className="p-1 rounded-full text-purple-200 hover:text-white hover:bg-white hover:bg-opacity-20 transition-colors"
                            title="Edit shift"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(shift, e)}
                            className="p-1 rounded-full text-purple-200 hover:text-white hover:bg-white hover:bg-opacity-20 transition-colors"
                            title="Delete shift"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {isToday && (
                <div className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                  Today
                </div>
              )}
            </div>
          </div>
        </div>
      );

      // Add cross-day shifts between this day and the next
      if (index < daysToShow.length - 1) {
        const nextDate = daysToShow[index + 1];
        const crossDayShifts = getCrossDayShifts(date, nextDate);
        
                // Add the dividing line
        elements.push(
          <div key={`divider-${dateString}`} className="border-t border-gray-400"></div>
        );
        
        // Add cross-day shifts that overlap into both day sections
        if (crossDayShifts.length > 0) {
          elements.push(
            <div key={`cross-${dateString}`} className="absolute left-0 right-0 transform -translate-y-6 px-4 flex justify-center z-20">
              <div className="flex gap-2">
                {crossDayShifts.map((shift) => (
                  <div
                    key={`cross-${shift.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#843484] rounded-lg hover:bg-[#6b2d6b] transition-colors group shadow-lg"
                  >
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <div className="text-white text-sm font-medium">
                      {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleEditClick(shift, e)}
                        className="p-1 rounded-full text-purple-200 hover:text-white hover:bg-white hover:bg-opacity-20 transition-colors"
                        title="Edit shift"
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(shift, e)}
                        className="p-1 rounded-full text-purple-200 hover:text-white hover:bg-white hover:bg-opacity-20 transition-colors"
                        title="Delete shift"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
      }
    });

    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {elements}
      </div>
    );
  };

  // Time picker helpers
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const dayOffsetOptions = [
    { value: 0, label: 'Same Day' },
    { value: 1, label: 'Next Day' },
    { value: 2, label: '+2 Days' }
  ];

  const TimeRoller = ({ 
    label, 
    value, 
    options, 
    onChange, 
    error 
  }: { 
    label: string; 
    value: number; 
    options: number[]; 
    onChange: (value: number) => void;
    error?: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className={`border-2 rounded-lg ${error ? 'border-red-500' : 'border-gray-300'}`}>
        <select
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full px-3 py-2 bg-white border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#843484] text-center text-lg font-medium"
        >
          {options.map(option => (
            <option key={option} value={option}>
              {option.toString().padStart(2, '0')}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );

  const DayOffsetPicker = ({ 
    label, 
    value, 
    options, 
    onChange 
  }: { 
    label: string; 
    value: number; 
    options: { value: number; label: string }[]; 
    onChange: (value: number) => void;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="border-2 border-gray-300 rounded-lg">
        <select
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full px-3 py-2 bg-white border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#843484] text-center text-lg font-medium"
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-20" style={{
      background: 'linear-gradient(135deg, #843484 0%, #47154f 100%)'
    }}>
      <div className="max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              🏢 Shift Manager
            </h1>
            <p className="text-purple-200 text-sm">
              Manage your work shifts
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-white shadow-md transition-all duration-200 hover:transform hover:-translate-y-0.5 hover:shadow-lg"
            style={{
              background: 'linear-gradient(90deg, #5d905c, #8cc455)'
            }}
          >
            <Plus size={18} />
            Add Shift
          </button>
        </div>

        {/* Calendar View */}
        <div className="space-y-3">
          {renderCalendarView()}
        </div>
      </div>

      {/* Add Shift Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-[20px] shadow-[0_20px_40px_rgba(0,0,0,0.3)] max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="mb-4">
                <Plus size={48} className="mx-auto text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Add New Shift</h3>
              <p className="text-gray-600 text-sm">
                Enter your work shift details
              </p>
            </div>

            <div className="space-y-4">
              {/* Start Time Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Start Time</h4>
                <div className="grid grid-cols-2 gap-2">
                  <TimeRoller
                    label="Hour"
                    value={formData.start_hour}
                    options={hours}
                    onChange={(value) => setFormData(prev => ({ ...prev, start_hour: value }))}
                  />
                  <TimeRoller
                    label="Minute"
                    value={formData.start_minute}
                    options={minutes}
                    onChange={(value) => setFormData(prev => ({ ...prev, start_minute: value }))}
                  />
                </div>
              </div>

              {/* End Time Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3">End Time</h4>
                <div className="grid grid-cols-3 gap-2">
                  <TimeRoller
                    label="Hour"
                    value={formData.end_hour}
                    options={hours}
                    onChange={(value) => setFormData(prev => ({ ...prev, end_hour: value }))}
                  />
                  <TimeRoller
                    label="Minute"
                    value={formData.end_minute}
                    options={minutes}
                    onChange={(value) => setFormData(prev => ({ ...prev, end_minute: value }))}
                  />
                  <DayOffsetPicker
                    label="Day"
                    value={formData.end_day_offset}
                    options={dayOffsetOptions}
                    onChange={(value) => setFormData(prev => ({ ...prev, end_day_offset: value }))}
                  />
                </div>
                {formErrors.end_time && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.end_time}</p>
                )}
              </div>

              {/* Visual Calendar Widget */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Select Date</label>
                <div className="border-2 border-gray-300 rounded-lg p-4">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-3">
                    <button
                      type="button"
                      onClick={() => navigateMonth('prev')}
                      className="p-1 rounded-lg hover:bg-gray-100 text-gray-600"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <h3 className="text-sm font-semibold text-gray-800">
                      {getMonthName(calendarDate)}
                    </h3>
                    <button
                      type="button"
                      onClick={() => navigateMonth('next')}
                      className="p-1 rounded-lg hover:bg-gray-100 text-gray-600"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  
                  {/* Days of week header */}
                  <div className="grid grid-cols-7 mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                      <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {renderCalendar()}
                  </div>
                </div>
                {formErrors.dates && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.dates}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="flex-1 py-3 px-4 rounded-full border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddShift}
                className="flex-1 py-3 px-4 rounded-full text-white font-medium transition-colors"
                style={{
                  background: 'linear-gradient(90deg, #5d905c, #8cc455)'
                }}
              >
                Add Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Shift Modal */}
      {showEditModal && shiftToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-[20px] shadow-[0_20px_40px_rgba(0,0,0,0.3)] max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="mb-4">
                <Edit size={48} className="mx-auto text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Edit Shift</h3>
              <p className="text-gray-600 text-sm">
                Update your work shift details
              </p>
            </div>

            <div className="space-y-4">
              {/* Start Time Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Start Time</h4>
                <div className="grid grid-cols-2 gap-2">
                  <TimeRoller
                    label="Hour"
                    value={formData.start_hour}
                    options={hours}
                    onChange={(value) => setFormData(prev => ({ ...prev, start_hour: value }))}
                  />
                  <TimeRoller
                    label="Minute"
                    value={formData.start_minute}
                    options={minutes}
                    onChange={(value) => setFormData(prev => ({ ...prev, start_minute: value }))}
                  />
                </div>
              </div>

              {/* End Time Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3">End Time</h4>
                <div className="grid grid-cols-3 gap-2">
                  <TimeRoller
                    label="Hour"
                    value={formData.end_hour}
                    options={hours}
                    onChange={(value) => setFormData(prev => ({ ...prev, end_hour: value }))}
                  />
                  <TimeRoller
                    label="Minute"
                    value={formData.end_minute}
                    options={minutes}
                    onChange={(value) => setFormData(prev => ({ ...prev, end_minute: value }))}
                  />
                  <DayOffsetPicker
                    label="Day"
                    value={formData.end_day_offset}
                    options={dayOffsetOptions}
                    onChange={(value) => setFormData(prev => ({ ...prev, end_day_offset: value }))}
                  />
                </div>
                {formErrors.end_time && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.end_time}</p>
                )}
              </div>

              {/* Visual Calendar Widget */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Select Date</label>
                <div className="border-2 border-gray-300 rounded-lg p-4">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-3">
                    <button
                      type="button"
                      onClick={() => navigateMonth('prev')}
                      className="p-1 rounded-lg hover:bg-gray-100 text-gray-600"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <h3 className="text-sm font-semibold text-gray-800">
                      {getMonthName(calendarDate)}
                    </h3>
                    <button
                      type="button"
                      onClick={() => navigateMonth('next')}
                      className="p-1 rounded-lg hover:bg-gray-100 text-gray-600"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  
                  {/* Days of week header */}
                  <div className="grid grid-cols-7 mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                      <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {renderCalendar()}
                  </div>
                </div>
                {formErrors.dates && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.dates}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setShiftToEdit(null);
                  resetForm();
                }}
                className="flex-1 py-3 px-4 rounded-full border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateShift}
                className="flex-1 py-3 px-4 rounded-full text-white font-medium transition-colors"
                style={{
                  background: 'linear-gradient(90deg, #5d905c, #8cc455)'
                }}
              >
                Update Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && shiftToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-[20px] shadow-[0_20px_40px_rgba(0,0,0,0.3)] max-w-sm w-full p-6">
            <div className="text-center">
              <div className="mb-4">
                <Trash2 size={48} className="mx-auto text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Shift</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the shift on{' '}
                <strong>{formatDate(shiftToDelete.date)}</strong>?
                <br />
                <span className="text-sm text-gray-500">This action cannot be undone.</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setShiftToDelete(null);
                  }}
                  className="flex-1 py-3 px-4 rounded-full border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-3 px-4 rounded-full text-white font-medium transition-colors"
                  style={{
                    background: 'linear-gradient(90deg, #dc2626, #b91c1c)'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Preferences Modal - shows on first visit */}
      {showPreferencesModal && (
        <UserPreferences 
          showAsModal={true}
          title="Welcome to Shift Manager! 🌙"
          onClose={() => setShowPreferencesModal(false)}
          onSave={() => {
            setHasPreferences(true);
            setShowPreferencesModal(false);
          }}
        />
      )}

      <BottomNav />
    </div>
  );
} 