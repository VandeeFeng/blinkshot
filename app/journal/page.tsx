"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase, type DreamJournal } from '@/lib/supabase';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import Image from 'next/image';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from "sonner";
import { useSearchParams } from 'next/navigation';

type ViewType = 'day' | 'week' | 'month' | 'recent';

export default function JournalPage() {
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [journals, setJournals] = useState<DreamJournal[]>([]);
  const [filteredJournals, setFilteredJournals] = useState<DreamJournal[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [viewType, setViewType] = useState<ViewType>('recent');

  const getJournalDates = useCallback(() => {
    return journals.map(journal => {
      const date = new Date(journal.dream_date);
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    });
  }, [journals]);

  useEffect(() => {
    fetchJournals();
  }, []);

  useEffect(() => {
    if (journals.length > 0) {
      let filtered;
      switch (viewType) {
        case 'day':
          filtered = journals.filter(journal => {
            const journalDate = new Date(journal.dream_date);
            return (
              journalDate.getFullYear() === selectedDate.getFullYear() &&
              journalDate.getMonth() === selectedDate.getMonth() &&
              journalDate.getDate() === selectedDate.getDate()
            );
          });
          break;
        case 'week':
          const weekStart = startOfWeek(selectedDate);
          const weekEnd = endOfWeek(selectedDate);
          filtered = journals.filter(journal => {
            const journalDate = new Date(journal.dream_date);
            return journalDate >= weekStart && journalDate <= weekEnd;
          });
          break;
        case 'month':
          filtered = journals.filter(journal => {
            const journalDate = new Date(journal.dream_date);
            return (
              journalDate.getMonth() === selectedDate.getMonth() &&
              journalDate.getFullYear() === selectedDate.getFullYear()
            );
          });
          break;
        default: // recent
          filtered = [...journals]
            .sort((a, b) => new Date(b.dream_date).getTime() - new Date(a.dream_date).getTime())
            .slice(0, 7);
      }
      setFilteredJournals(filtered);
    }
  }, [selectedDate, journals, viewType]);

  async function fetchJournals() {
    const { data, error } = await supabase
      .from('dream_journals')
      .select('*')
      .order('dream_date', { ascending: false });

    if (error) {
      console.error('Error fetching journals:', error);
      return;
    }

    setJournals(data);
  }

  async function handleDelete(journalId: string) {
    if (!confirm('Are you sure you want to delete this journal entry?')) return;

    const { error } = await supabase
      .from('dream_journals')
      .delete()
      .eq('id', journalId);

    if (error) {
      console.error('Error deleting journal:', error);
      toast.error('Failed to delete journal');
      return;
    }

    setJournals(journals.filter(j => j.id !== journalId));
    setFilteredJournals(filteredJournals.filter(j => j.id !== journalId));
    toast.success('Journal deleted successfully');
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setViewType('day');
    }
  };

  const getDisplayTitle = () => {
    switch (viewType) {
      case 'day':
        return format(selectedDate, 'MMMM d, yyyy');
      case 'week':
        return `Week of ${format(startOfWeek(selectedDate), 'MMM dd')} - ${format(endOfWeek(selectedDate), 'MMM dd, yyyy')}`;
      case 'month':
        return format(selectedDate, 'MMMM yyyy');
      default:
        return 'Recent Dreams';
    }
  };

  return (
    <div className="container max-w-5xl mx-auto p-4">
      <div className="flex flex-col items-center gap-4 mb-8">
        <Link 
          href={`/${searchParams.toString()}`}
          className={cn(
            "self-start flex items-center gap-2 text-gray-300 hover:text-blue-400 transition-colors",
            "bg-transparent p-2 rounded-lg",
            "hover:bg-gray-800/80",
            "group"
          )}
        >
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span>Back to Dream Composer</span>
        </Link>
        <h1 className="text-4xl font-bold text-gray-100">Dream Journal</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold">{getDisplayTitle()}</h2>
            <div className="flex gap-3">
              {viewType !== 'recent' && (
                <button
                  onClick={() => setViewType('recent')}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  View Recent
                </button>
              )}
              {viewType !== 'week' && (
                <button
                  onClick={() => setViewType('week')}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  View Week
                </button>
              )}
              {viewType !== 'month' && (
                <button
                  onClick={() => setViewType('month')}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  View Month
                </button>
              )}
            </div>
          </div>
          
          {viewType === 'day' && filteredJournals.length === 0 && (
            <div className="text-center py-8 text-gray-400 bg-gray-800/50 rounded-lg">
              No dreams recorded for {format(selectedDate, 'MMMM d, yyyy')}
            </div>
          )}

          {filteredJournals.map((journal) => (
            <div 
              key={journal.id}
              className="group bg-gray-800/50 p-3 rounded-lg shadow-lg backdrop-blur-sm 
              border border-gray-700 
              hover:border-blue-500/50 hover:bg-gray-800/70
              transition-all duration-300 ease-in-out
              hover:shadow-xl hover:shadow-blue-500/10
              transform hover:-translate-y-1
              max-w-2xl"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-base group-hover:text-blue-400 transition-colors">
                    {journal.title}
                  </h3>
                  <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                    {format(new Date(journal.dream_date), 'MMM dd, yyyy')}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(journal.id)}
                  className="p-1.5 rounded-md text-gray-300 hover:text-red-400 
                  hover:bg-red-400/10 transition-colors
                  opacity-70 hover:opacity-100"
                  title="Delete journal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-sm text-gray-300 mb-2 group-hover:text-gray-100 transition-colors">
                {journal.content}
              </p>
              
              {journal.generated_image_b64 && (
                <div 
                  className="relative h-36 w-full cursor-pointer 
                  overflow-hidden rounded-md
                  transform transition-all duration-300
                  group-hover:shadow-lg group-hover:shadow-blue-500/20"
                  onClick={() => setSelectedImage(journal.generated_image_b64!)}
                >
                  <Image
                    src={`data:image/png;base64,${journal.generated_image_b64}`}
                    alt="Dream visualization"
                    fill
                    className="object-cover rounded-md 
                    transition-transform duration-300
                    group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg backdrop-blur-sm md:sticky md:top-4 h-fit w-fit">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            modifiers={{
              hasJournal: getJournalDates()
            }}
            className={cn(
              "text-gray-200",
              "[&_table]:w-fit",
              "[&_thead]:block [&_thead_tr]:flex [&_thead_tr]:w-full [&_thead_tr]:justify-between",
              "[&_th]:w-10 [&_th]:text-center [&_th]:font-normal",
              "[&_tbody]:block",
              "[&_tbody_tr]:flex [&_tbody_tr]:justify-between",
              "[&_td]:w-10 [&_td]:text-center",
              "[&_.rdp-day]:h-9 [&_.rdp-day]:w-9",
              "[&_.rdp-day_span]:text-center",
              "[&_.rdp-day.rdp-day_selected]:bg-transparent",
              "[&_.rdp-day.rdp-day_today]:bg-transparent",
              "[&_.rdp-day.rdp-day_selected]:after:content-[''] [&_.rdp-day.rdp-day_selected]:after:absolute [&_.rdp-day.rdp-day_selected]:after:inset-[20%] [&_.rdp-day.rdp-day_selected]:after:bg-[#4B5563] [&_.rdp-day.rdp-day_selected]:after:rounded-md [&_.rdp-day.rdp-day_selected]:after:-z-10",
              "[&_.rdp-day.rdp-day_today]:after:content-[''] [&_.rdp-day.rdp-day_today]:after:absolute [&_.rdp-day.rdp-day_today]:after:inset-[20%] [&_.rdp-day.rdp-day_today]:after:bg-[#374151] [&_.rdp-day.rdp-day_today]:after:rounded-md [&_.rdp-day.rdp-day_today]:after:-z-10 [&_.rdp-day.rdp-day_today]:after:border [&_.rdp-day.rdp-day_today]:after:border-[#4B5563] [&_.rdp-day.rdp-day_today]:after:shadow-[0_0_0_1px_#4B5563]",
              "[&_.rdp-day.rdp-day_hasJournal]:after:content-[''] [&_.rdp-day.rdp-day_hasJournal]:after:absolute [&_.rdp-day.rdp-day_hasJournal]:after:inset-[20%] [&_.rdp-day.rdp-day_hasJournal]:after:bg-[#34403a] [&_.rdp-day.rdp-day_hasJournal]:after:rounded-md [&_.rdp-day.rdp-day_hasJournal]:after:-z-10",
              "[&_.rdp-day]:relative [&_.rdp-day]:transition-transform [&_.rdp-day]:duration-200",
              "[&_.rdp-day_selected]:scale-110 [&_.rdp-day_today]:scale-110 [&_.rdp-day_hasJournal]:scale-110"
            )}
          />
        </div>
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[90vw] w-full max-h-[90vh] p-0 bg-gray-900/95 border border-gray-700">
          {selectedImage && (
            <div className="relative w-full h-[80vh]">
              <Image
                src={`data:image/png;base64,${selectedImage}`}
                alt="Dream visualization"
                fill
                className="object-contain"
                priority
                sizes="(max-width: 768px) 100vw, 90vw"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(null);
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 