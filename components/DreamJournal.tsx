import { useState, useEffect } from 'react';
import { supabase, type DreamJournal } from '@/lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { format } from 'date-fns';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Pencil2Icon, TrashIcon } from '@radix-ui/react-icons';

interface Props {
  onSelectContent: (content: string) => void;
  journals: DreamJournal[];
  setJournals: (journals: DreamJournal[]) => void;
  onImageGenerated?: (journalId: string, imageBase64: string) => void;
}

export default function DreamJournal({ 
  onSelectContent, 
  journals, 
  setJournals,
  onImageGenerated 
}: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchJournals();
  }, []);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (editingId) {
      const { error } = await supabase
        .from('dream_journals')
        .update({
          title,
          content,
          dream_date: date.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);

      if (error) {
        console.error('Error updating journal:', error);
      } else {
        setEditingId(null);
      }
    } else {
      const { error } = await supabase
        .from('dream_journals')
        .insert([{
          title,
          content,
          dream_date: date.toISOString(),
        }]);

      if (error) {
        console.error('Error saving journal:', error);
      }
    }

    setTitle('');
    setContent('');
    setDate(new Date());
    fetchJournals();
    setLoading(false);
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm('Are you sure you want to delete this dream journal?');
    if (!confirmed) return;

    const { error } = await supabase
      .from('dream_journals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting journal:', error);
    } else {
      fetchJournals();
    }
  }

  function handleEdit(journal: DreamJournal) {
    setEditingId(journal.id);
    setTitle(journal.title);
    setContent(journal.content);
    setDate(new Date(journal.dream_date));
  }

  function handleJournalSelect(content: string) {
    onSelectContent(content);
  }

  return (
    <div className="w-80 h-full border-r border-gray-300 p-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Dream Journal</h2>
      
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <Input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => date && setDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Textarea
          placeholder="Describe your dream..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
        />
        <Button type="submit" disabled={loading}>
          {editingId ? 'Update Dream' : 'Save Dream'}
        </Button>
        {editingId && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              setEditingId(null);
              setTitle('');
              setContent('');
              setDate(new Date());
            }}
          >
            Cancel Edit
          </Button>
        )}
      </form>

      <div className="space-y-4">
        {journals.map((journal) => (
          <div
            key={journal.id}
            className="p-3 border rounded-lg hover:bg-gray-400 cursor-pointer"
            onClick={() => handleJournalSelect(journal.content)}
          >
            <h3 className="font-medium">{journal.title}</h3>
            <p className="text-sm text-gray-300">
              {format(new Date(journal.dream_date), 'MMM dd, yyyy')}
            </p>
            <p className="text-sm line-clamp-2">{journal.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
} 