'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string[];
  sources?: Array<{
    // content: string;
    source_url?: string;
    filename?: string;
  }>;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [session, setSession] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
    }
  }, [router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      const formData = new FormData();
      formData.append('file', e.target.files[0]);

      try {
        const response = await fetch('http://localhost:8002/ingest', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        });

        if (response.ok) {
          toast.success('Document uploaded successfully!');
        } else {
          toast.error('Failed to upload document.');
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('An error occurred during upload.');
      }
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;


    setIsLoadingUrl(true);
    try {
      const response = await fetch('http://localhost:8002/ingest-url', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        toast.success('URL content processed successfully!');
        setUrl('');
      } else {
        toast.error('Failed to process URL.');
      }

    } catch (error) {
      console.error('URL processing error:', error);
      toast.error('An error occurred while processing the URL.');
    }finally {
      setIsLoadingUrl(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const payload = {
      sessionId:session ?? "",
      userId:"123",
      prompt:input
    }

    try {
      const response = await fetch('http://localhost:8002/ask', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          reasoning: data.reasoning_steps,
          sources: data.source_documents,
        };
        setSession(data.sessionId ?? "");
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        toast.error('Failed to get response.');
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('An error occurred while getting the response.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen">
      <div className="flex-none bg-white shadow p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">RAG Agent Chat</h1>
          <div className="flex gap-4">
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              accept=".pdf,.txt,.doc,.docx"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              Upload Document
            </label>
            <form onSubmit={handleUrlSubmit} className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter URL"
                className="border rounded px-2"
              />
              <button
              disabled={isLoadingUrl}
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                {isLoadingUrl ? 'Processing...' : 'Submit URL'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                message.role === 'user'
                  ? 'bg-indigo-100 ml-auto max-w-md'
                  : 'bg-white max-w-2xl'
              }`}
            >
              <p className="text-gray-800">{message.content}</p>
              {message.reasoning && (
                <div className="mt-2 text-sm text-gray-600">
                  <p className="font-semibold">Reasoning steps:</p>
                  <ul className="list-disc pl-4">
                    {message.reasoning.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
              {message.sources && (
                <div className="mt-2 text-sm text-gray-600">
                  <p className="font-semibold">Sources:</p>
                  <ul className="list-disc pl-4">
                    {message.sources.map((source, idx) => (
                      <li key={idx}>
                        <p className="font-medium">{source.source_url ? source.source_url : source.filename }</p>
                        {/* <p className="text-gray-500">{source.content}</p> */}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-none bg-white border-t p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Thinking...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
} 