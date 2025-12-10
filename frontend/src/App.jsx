import React, { useState, useRef, useCallback, useEffect } from 'react'
import axios from 'axios'
import axiosInstance from './utils/axios'
import toast from 'react-hot-toast'
import Layout from './components/Layout'
import { Button, Card, CardHeader, CardBody, Badge, Spinner, SkeletonCard } from './components/ui'


// Get API URL from environment variable or use default
const getApiUrl = () => {
  return (
    import.meta.env.VITE_API_ROOT ||
    import.meta.env.VITE_API_URL ||
    (window.location.origin.includes('5173') ? 'http://localhost:8000' : window.location.origin) ||
    'http://localhost:8000'
  );
};

const API_ROOT = getApiUrl();
console.log('[App] Using API URL:', API_ROOT);

export default function App() {
  // State management
  const [file, setFile] = useState(null)
  const [pasted, setPasted] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [summary, setSummary] = useState('')
  const [actionItems, setActionItems] = useState([])
  const [decisions, setDecisions] = useState([])
  const [keyTopics, setKeyTopics] = useState([])
  const [meetings, setMeetings] = useState([])
  const [totalMeetings, setTotalMeetings] = useState(0)
  
  // Loading states
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [isExtractingActions, setIsExtractingActions] = useState(false)
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(false)
  const [deletingMeetingId, setDeletingMeetingId] = useState(null)
  
  // Title editing state
  const [editingMeetingId, setEditingMeetingId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all') // all, today, week, month
  const [sortBy, setSortBy] = useState('date_desc') // date_desc, date_asc, title
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  
  // Timing states
  const [transcribeTime, setTranscribeTime] = useState(0)
  const [summarizeTime, setSummarizeTime] = useState(0)
  const [actionItemsTime, setActionItemsTime] = useState(0)
  
  // Timer refs
  const transcribeTimerRef = useRef(null)
  const summarizeTimerRef = useRef(null)
  const actionItemsTimerRef = useRef(null)
  
  // Cancel token ref
  const cancelTokenRef = useRef(null)
  
  // File path state
  const [filePath, setFilePath] = useState('')
  
  // System status state
  const [systemStatus, setSystemStatus] = useState(null)
  const [isLoadingStatus, setIsLoadingStatus] = useState(false)
  
  // Advanced filter states
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterHasActions, setFilterHasActions] = useState(false)
  
  // Expandable meetings state
  const [expandedMeetings, setExpandedMeetings] = useState({})
  
  // Bulk operations state
  const [selectedMeetings, setSelectedMeetings] = useState(new Set())
  const [isBulkMode, setIsBulkMode] = useState(false)
  
  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(30)
  const autoRefreshTimerRef = useRef(null)
  
  // Error state
  const [error, setError] = useState(null)

  // ---------- Auto-save state ----------
  const [autosaveEnabled, setAutosaveEnabled] = useState(true)
  const [savedMeetingId, setSavedMeetingId] = useState(null)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const autosaveTimerRef = useRef(null)
  
  // Draft recovery state
  const [showDraftBanner, setShowDraftBanner] = useState(false)
  const [draftData, setDraftData] = useState(null)
  
  // Skip to content ref
  const skipToContentRef = useRef(null)
  
  // Load meetings on mount and check for drafts
  useEffect(() => {
    fetchMeetings()
    checkForDraft()
  }, [])
  
  // Check for unsaved draft in localStorage
  const checkForDraft = () => {
    try {
      const draft = localStorage.getItem('meeting_draft')
      if (draft) {
        const parsed = JSON.parse(draft)
        const draftAge = Date.now() - (parsed.timestamp || 0)
        // Show banner if draft is less than 24 hours old
        if (draftAge < 24 * 60 * 60 * 1000) {
          setDraftData(parsed)
          setShowDraftBanner(true)
        } else {
          // Clear old drafts
          localStorage.removeItem('meeting_draft')
        }
      }
    } catch (err) {
      console.error('Failed to load draft:', err)
    }
  }
  
  // Restore draft from localStorage
  const restoreDraft = () => {
    if (draftData) {
      setEditingTitle(draftData.title || '')
      setTranscript(draftData.transcript || '')
      setSummary(draftData.summary || '')
      setActionItems(draftData.actionItems || [])
      setDecisions(draftData.decisions || [])
      setKeyTopics(draftData.keyTopics || [])
      toast.success('Draft restored successfully')
    }
    setShowDraftBanner(false)
    localStorage.removeItem('meeting_draft')
  }
  
  // Discard draft
  const discardDraft = () => {
    setShowDraftBanner(false)
    localStorage.removeItem('meeting_draft')
    toast.success('Draft discarded')
  }
  
  // Debounced search effect - re-fetch meetings when search query changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchMeetings()
    }, 300) // 300ms debounce
    
    return () => clearTimeout(debounceTimer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])
  
  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshTimerRef.current = setInterval(() => {
        fetchMeetings()
      }, refreshInterval * 1000)
    } else {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current)
        autoRefreshTimerRef.current = null
      }
    }
    
    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current)
      }
    }
  }, [autoRefresh, refreshInterval])
  
  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      stopTimer('transcribe')
      stopTimer('summarize')
      stopTimer('actionItems')
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    }
  }, [])

  // Save draft to localStorage as offline fallback
  const saveDraftToLocalStorage = () => {
    try {
      const draft = {
        title: editingTitle,
        transcript,
        summary,
        actionItems,
        decisions,
        keyTopics,
        timestamp: Date.now()
      }
      localStorage.setItem('meeting_draft', JSON.stringify(draft))
    } catch (err) {
      console.error('Failed to save draft to localStorage:', err)
    }
  }
  
  // Debounced auto-save when content changes
  const scheduleAutosave = (reason = 'change') => {
    if (!autosaveEnabled) return
    if (!transcript && !summary && actionItems.length === 0 && decisions.length === 0 && keyTopics.length === 0) return
    
    // Save to localStorage as backup
    saveDraftToLocalStorage()
    
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    autosaveTimerRef.current = setTimeout(() => {
      void performAutoSave(reason)
    }, 1500)
  }

  const performAutoSave = async (reason = 'change') => {
    if (!autosaveEnabled) return
    if (!transcript && !summary) return
    setIsAutoSaving(true)
    try {
      if (savedMeetingId) {
        // Update existing meeting
        await axiosInstance.put(`/meetings/${savedMeetingId}`, {
          title: editingTitle || undefined,
          transcript: transcript || undefined,
          summary: summary || undefined,
        })
      } else {
        // Create new meeting
        const form = new URLSearchParams()
        form.append('title', editingTitle || 'Untitled Meeting')
        form.append('transcript', transcript || '')
        form.append('summary', summary || '')
        const resp = await axiosInstance.post('/save', form)
        const newId = resp?.data?.id
        if (newId) setSavedMeetingId(newId)
      }
      setLastSavedAt(new Date())
      setError(null)
      // Clear localStorage draft on successful save
      localStorage.removeItem('meeting_draft')
    } catch (err) {
      setError(`Autosave failed: ${err.response?.data?.detail || err.message}`)
      // Keep localStorage draft on failure as backup
    } finally {
      setIsAutoSaving(false)
    }
  }

  useEffect(() => {
    scheduleAutosave('content-change')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingTitle, transcript, summary, actionItems, decisions, keyTopics])
  
  const fetchMeetings = async () => {
    setIsLoadingMeetings(true)
    console.log('Fetching meetings from:', `${API_ROOT}/meetings`)
    try {
      // Include search query parameter if present
      const params = {}
      if (searchQuery && searchQuery.trim()) {
        params.search = searchQuery.trim()
      }
      
      const r = await axiosInstance.get('/meetings', { params })
      setMeetings(r.data.meetings || [])
      setTotalMeetings(r.data.total || 0)
      toast.success('Meetings loaded')
    } catch (err) {
      console.error('Failed to load meetings:', err)
      console.error('API URL was:', `${API_ROOT}/meetings`)
      toast.error(`Failed to load meetings: ${err.message}`)
    } finally {
      setIsLoadingMeetings(false)
    }
  }
  
  // Timer utility functions
  const startTimer = (type) => {
    const startTime = Date.now()
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      if (type === 'transcribe') {
        setTranscribeTime(elapsed)
      } else if (type === 'summarize') {
        setSummarizeTime(elapsed)
      } else if (type === 'actionItems') {
        setActionItemsTime(elapsed)
      }
    }, 1000)
    
    if (type === 'transcribe') {
      transcribeTimerRef.current = timer
    } else if (type === 'summarize') {
      summarizeTimerRef.current = timer
    } else if (type === 'actionItems') {
      actionItemsTimerRef.current = timer
    }
  }
  
  const stopTimer = (type) => {
    if (type === 'transcribe' && transcribeTimerRef.current) {
      clearInterval(transcribeTimerRef.current)
      transcribeTimerRef.current = null
    } else if (type === 'summarize' && summarizeTimerRef.current) {
      clearInterval(summarizeTimerRef.current)
      summarizeTimerRef.current = null
    } else if (type === 'actionItems' && actionItemsTimerRef.current) {
      clearInterval(actionItemsTimerRef.current)
      actionItemsTimerRef.current = null
    }
  }
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const transcribeFile = async () => {
    if (!file && !pasted) {
      toast.error('Please select a file or paste text')
      return
    }
    
    setIsTranscribing(true)
    setUploadProgress(0)
    setTranscribeTime(0)
    setError(null)
    
    // Start timer
    startTimer('transcribe')
    
    // Create cancel token
    cancelTokenRef.current = axios.CancelToken.source()
    
    try {
      const form = new FormData()
      if (file) {
        form.append('file', file)
      } else if (pasted) {
        form.append('pasted', pasted)
      }
      
      const r = await axiosInstance.post('/transcribe', form, {
        cancelToken: cancelTokenRef.current.token,
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(percent)
        }
      })
      
      setTranscript(r.data.text)
      setUploadProgress(100)
      
      // Check if it's a text file (no transcription needed)
      if (r.data.is_text_file) {
        toast.success(`Text file loaded! ${r.data.message || ''}`)
      } else {
        toast.success(`Transcription complete! (${formatTime(transcribeTime)})`)
      }
      
      scheduleAutosave('transcription')
    } catch (err) {
      if (axios.isCancel(err)) {
        toast.error('Transcription cancelled')
        setError('Transcription cancelled by user')
      } else {
        toast.error(`Transcription failed: ${err.message}`)
        setError(`Transcription failed: ${err.response?.data?.error || err.message}`)
      }
    } finally {
      stopTimer('transcribe')
      setIsTranscribing(false)
      cancelTokenRef.current = null
    }
  }
  
  const cancelTranscription = () => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('User cancelled the transcription')
    }
  }
  
  const doSummarize = async () => {
    if (!transcript) {
      toast.error('Please transcribe something first')
      return
    }
    
    setIsSummarizing(true)
    setSummarizeTime(0)
    setError(null)
    
    // Start timer
    startTimer('summarize')
    
    try {
      const form = new URLSearchParams()
      form.append('text', transcript)
      form.append('require_ai', 'true')
      form.append('ai_model', 'gemini-1.5-flash')
      const r = await axiosInstance.post('/summarize', form)
      setSummary(r.data.summary)
      // Only update the summary here. Action items/decisions/topics are extracted via the separate button.
      toast.success(`Summary generated! (${formatTime(summarizeTime)})`)
      scheduleAutosave('summary')
    } catch (err) {
      toast.error(`Summarization failed: ${err.message}`)
      setError(`Summarization failed: ${err.response?.data?.detail || err.message}`)
    } finally {
      stopTimer('summarize')
      setIsSummarizing(false)
    }
  }
  
  const extractActionItems = async () => {
    if (!transcript) {
      toast.error('Please transcribe something first')
      return
    }
    
    setIsExtractingActions(true)
    setActionItemsTime(0)
    setError(null)
    
    // Start timer
    startTimer('actionItems')
    
    try {
      const form = new URLSearchParams()
      form.append('text', transcript)
      form.append('meeting_date', new Date().toISOString())
      form.append('require_ai', 'true')
      form.append('ai_model', 'gemini-1.5-flash')
      
      // Use summarize endpoint which includes action items extraction
      const r = await axiosInstance.post('/summarize', form)
      const result = r.data
      
      if (result && typeof result === 'object') {
        // Update summary if not already set
        if (result.summary && !summary) {
          setSummary(result.summary)
        }
        setActionItems(result.action_items || [])
        setDecisions(result.decisions || [])
        setKeyTopics(result.key_topics || [])
        toast.success(`Extracted ${(result.action_items || []).length} action items! (${formatTime(actionItemsTime)})`)
        scheduleAutosave('analysis')
      }
    } catch (err) {
      toast.error(`Extraction failed: ${err.message}`)
      setError(`Action items extraction failed: ${err.response?.data?.detail || err.message}`)
    } finally {
      stopTimer('actionItems')
      setIsExtractingActions(false)
    }
  }
  
  const deleteMeeting = async (meetingId) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return
    
    setDeletingMeetingId(meetingId)
    try {
      await axiosInstance.delete(`/meetings/${meetingId}`)
      toast.success('Meeting deleted successfully!')
      fetchMeetings()
    } catch (err) {
      toast.error(`Delete failed: ${err.message}`)
    } finally {
      setDeletingMeetingId(null)
    }
  }
  
  const startEditingTitle = (meeting) => {
    setEditingMeetingId(meeting.id)
    setEditingTitle(meeting.title || '')
  }
  
  const cancelEditingTitle = () => {
    setEditingMeetingId(null)
    setEditingTitle('')
  }
  
  const updateMeetingTitle = async (meetingId) => {
    if (!editingTitle.trim()) {
      toast.error('Title cannot be empty')
      return
    }
    
    try {
      await axiosInstance.put(`/meetings/${meetingId}`, {
        title: editingTitle.trim()
      })
      toast.success('Title updated successfully!')
      setEditingMeetingId(null)
      setEditingTitle('')
      fetchMeetings()
    } catch (err) {
      toast.error(`Update failed: ${err.message}`)
    }
  }
  
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard!`)
    }).catch(err => {
      toast.error(`Failed to copy: ${err.message}`)
    })
  }
  
  const downloadText = (filename, text) => {
    const blob = new Blob([text || ''], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    toast.success('File downloaded!')
  }
  
  // Save Meeting
  const saveMeeting = async () => {
    const title = prompt('Enter meeting title:', 'Untitled Meeting')
    if (!title) return
    
    try {
      const form = new URLSearchParams()
      form.append('title', title)
      form.append('transcript', transcript)
      form.append('summary', summary)
      if (actionItems.length) form.append('action_items', JSON.stringify(actionItems))
      if (decisions.length) form.append('decisions', JSON.stringify(decisions))
      if (keyTopics.length) form.append('key_topics', JSON.stringify(keyTopics))
      
      const resp = await axiosInstance.post('/save', form)
      const newId = resp?.data?.id
      
      // Clear form after successful save
      setTranscript('')
      setSummary('')
      setActionItems([])
      setDecisions([])
      setKeyTopics([])
      setFile(null)
      setPasted('')
      setUploadProgress(0)
      
      await fetchMeetings()
      toast.success(`Meeting saved successfully${newId ? ' (ID: ' + newId.slice(-6) + ')' : ''}!`)
    } catch (err) {
      toast.error(`Save failed: ${err.message}`)
      setError(`Save failed: ${err.response?.data?.detail || err.message}`)
    }
  }
  
  // Transcribe from file path
  const transcribeFromPath = async () => {
    if (!filePath) {
      toast.error('Please enter a file path')
      return
    }
    
    setIsTranscribing(true)
    setTranscribeTime(0)
    setError(null)
    
    startTimer('transcribe')
    
    try {
      const form = new URLSearchParams()
      form.append('file_path', filePath)
      const r = await axiosInstance.post('/transcribe-path', form)
      setTranscript(r.data.text)
      toast.success(`Transcription complete! (${formatTime(transcribeTime)})`)
    } catch (err) {
      toast.error(`Path transcription failed: ${err.message}`)
      setError(`Path transcription failed: ${err.response?.data?.detail || err.message}`)
    } finally {
      stopTimer('transcribe')
      setIsTranscribing(false)
    }
  }
  
  // Fetch system status
  const fetchStatus = async () => {
    setIsLoadingStatus(true)
    try {
      const r = await axiosInstance.get('/status')
      setSystemStatus(r.data)
      toast.success('Status loaded')
    } catch (err) {
      toast.error(`Failed to load status: ${err.message}`)
    } finally {
      setIsLoadingStatus(false)
    }
  }
  
  // Toggle meeting expansion
  const toggleMeetingExpansion = (meetingId) => {
    setExpandedMeetings(prev => ({
      ...prev,
      [meetingId]: !prev[meetingId]
    }))
  }
  
  // Bulk operations
  const toggleMeetingSelection = (meetingId) => {
    setSelectedMeetings(prev => {
      const newSet = new Set(prev)
      if (newSet.has(meetingId)) {
        newSet.delete(meetingId)
      } else {
        newSet.add(meetingId)
      }
      return newSet
    })
  }
  
  const selectAllMeetings = () => {
    setSelectedMeetings(new Set(paginatedMeetings.map(m => m.id)))
  }
  
  const clearSelection = () => {
    setSelectedMeetings(new Set())
  }
  
  const bulkDelete = async () => {
    if (selectedMeetings.size === 0) {
      toast.error('No meetings selected')
      return
    }
    
    if (!confirm(`Delete ${selectedMeetings.size} meetings?`)) return
    
    try {
      await Promise.all(
        Array.from(selectedMeetings).map(id => 
          axiosInstance.delete(`/meetings/${id}`)
        )
      )
      toast.success(`Deleted ${selectedMeetings.size} meetings`)
      clearSelection()
      fetchMeetings()
    } catch (err) {
      toast.error(`Bulk delete failed: ${err.message}`)
    }
  }
  
  const bulkExport = () => {
    if (selectedMeetings.size === 0) {
      toast.error('No meetings selected')
      return
    }
    
    const selectedData = meetings.filter(m => selectedMeetings.has(m.id))
    const exportText = selectedData.map(m => 
      `Title: ${m.title}
Date: ${new Date(m.created_at).toLocaleString()}

Transcript:
${m.transcript || 'N/A'}

Summary:
${m.summary || 'N/A'}

${'-'.repeat(80)}

`
    ).join('')
    
    downloadText('meetings-export.txt', exportText)
    toast.success(`Exported ${selectedMeetings.size} meetings`)
  }
  
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])
  
  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])
  
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setFile(files[0])
      setPasted('')
      toast.success(`File selected: ${files[0].name}`)
    }
  }, [])
  
  // Filter and sort meetings (search is now handled by backend)
  const filteredMeetings = React.useMemo(() => {
    let filtered = [...meetings]
    
    // Date filter (basic)
    if (dateFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter(m => {
        const meetingDate = new Date(m.created_at)
        
        if (dateFilter === 'today') {
          return meetingDate >= today
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)
          return meetingDate >= weekAgo
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(today)
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          return meetingDate >= monthAgo
        }
        return true
      })
    }
    
    // Advanced date filters (from/to)
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom)
      filtered = filtered.filter(m => new Date(m.created_at) >= fromDate)
    }
    
    if (filterDateTo) {
      const toDate = new Date(filterDateTo)
      toDate.setHours(23, 59, 59, 999) // End of day
      filtered = filtered.filter(m => new Date(m.created_at) <= toDate)
    }
    
    // Filter by action items
    if (filterHasActions) {
      filtered = filtered.filter(m => m.action_items && m.action_items.length > 0)
    }
    
    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.created_at) - new Date(a.created_at)
      } else if (sortBy === 'date_asc') {
        return new Date(a.created_at) - new Date(b.created_at)
      } else if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '')
      }
      return 0
    })
    
    return filtered
  }, [meetings, searchQuery, dateFilter, sortBy, filterDateFrom, filterDateTo, filterHasActions])
  
  // Paginated meetings
  const paginatedMeetings = React.useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage
    const endIdx = startIdx + itemsPerPage
    return filteredMeetings.slice(startIdx, endIdx)
  }, [filteredMeetings, currentPage, itemsPerPage])
  
  const totalPages = Math.ceil(filteredMeetings.length / itemsPerPage)
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, dateFilter, sortBy])
  
  // Focus skip link on keyboard navigation
  useEffect(() => {
    const handleTabKey = (e) => {
      if (e.key === 'Tab') {
        if (skipToContentRef.current) {
          skipToContentRef.current.classList.remove('sr-only')
        }
      }
    }
    
    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [])
  
  return (
    <Layout>
      {/* Skip to content link for accessibility */}
      <a 
        href="#main-content" 
        ref={skipToContentRef}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary-600 text-white px-4 py-2 rounded-lg"
      >
        Skip to main content
      </a>
      
      <div id="main-content" className="space-y-6">
        {/* Error Display Panel */}
        {error && (
          <Card 
            aria-label="Error notification"
            elevated
          >
            <CardBody className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-red-900 dark:text-red-100">Error</h4>
                    <p className="text-sm text-red-800 dark:text-red-200 mt-1">{error}</p>
                  </div>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                  aria-label="Close error message"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </CardBody>
          </Card>
        )}
        
        {/* Draft Recovery Banner */}
        {showDraftBanner && draftData && (
          <Card 
            aria-label="Draft recovery notification"
            elevated
          >
            <CardBody className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">Unsaved Draft Found</h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                      You have an unsaved draft from {new Date(draftData.timestamp).toLocaleString()}. Would you like to restore it?
                    </p>
                    {draftData.title && (
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Title: <span className="font-medium">{draftData.title}</span>
                      </p>
                    )}
                    <div className="flex gap-3 mt-3">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={restoreDraft}
                        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                        aria-label="Restore draft"
                      >
                        Restore Draft
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={discardDraft}
                        className="text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        aria-label="Discard draft"
                      >
                        Discard
                      </Button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={discardDraft}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                  aria-label="Close draft banner"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </CardBody>
          </Card>
        )}
        
        {/* System Status Panel */}
        {systemStatus && (
          <Card 
            aria-label="System status information"
            elevated
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Status</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSystemStatus(null)}
                  aria-label="Close system status"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className="ml-2 font-medium text-green-600 dark:text-green-400">● Online</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">API Version:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{systemStatus.version || 'N/A'}</span>
                </div>
                {systemStatus.config && Object.entries(systemStatus.config).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white text-xs break-all">{String(value)}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
        
        {/* Upload Section */}
        <Card 
          aria-label="Upload meeting recording"
          elevated
        >
          <CardHeader>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Upload Meeting Recording
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Upload an audio/video file or paste transcript text
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            {/* Drag & Drop Zone */}
            <div
              onClick={() => document.getElementById('fileInput').click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
                ${isDragging 
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 scale-105' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
                }
              `}
              aria-label="Drag and drop file upload area"
              tabIndex="0"
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  document.getElementById('fileInput').click()
                }
              }}
            >
              <div className="flex flex-col items-center">
                <svg className={`w-12 h-12 mb-3 transition-colors ${
                  isDragging ? 'text-primary-500' : 'text-gray-400'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {isDragging ? (
                    <span className="font-semibold text-primary-600 dark:text-primary-400">Drop file here</span>
                  ) : (
                    <>
                      <span className="font-semibold text-primary-600 dark:text-primary-400">Click to upload</span> or drag and drop
                    </>
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Audio/Video files (WAV, MP3, MP4, AVI, MOV, MKV, OGG, WEBM) or Text files (TXT, MD, PDF, DOCX, RTF) - Text files display directly
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                  Max file size: 500MB • Max duration: 60 minutes
                </p>
              </div>
              <input
                type="file"
                onChange={e => {
                  setFile(e.target.files[0])
                  setPasted('')
                }}
                accept=".wav,.mp3,.m4a,.ogg,.webm,.mp4,.avi,.mov,.mkv,.txt,.md,.pdf,.docx,.rtf"
                className="hidden"
                id="fileInput"
                aria-label="File input"
              />
            </div>
            
            {/* Selected File Display */}
            {file && (
              <div className="flex items-center justify-between p-3 bg-success-50 dark:bg-success-900/20 rounded-lg border border-success-200 dark:border-success-800">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setFile(null)
                    setUploadProgress(0)
                  }}
                  aria-label="Remove selected file"
                >
                  Remove
                </Button>
              </div>
            )}
            
            {/* Upload Progress Bar */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Uploading...</span>
                  <span className="font-medium text-gray-900 dark:text-white">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                    role="progressbar"
                    aria-valuenow={uploadProgress}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label="Upload progress"
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Or Paste Transcript
              </label>
              <textarea
                value={pasted}
                onChange={e => {
                  setPasted(e.target.value)
                  setFile(null)
                }}
                rows={4}
                placeholder="Paste transcript text here..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                aria-label="Paste transcript text"
              />
              {pasted && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {pasted.length} characters, {pasted.split(/\s+/).filter(w => w).length} words
                </p>
              )}
            </div>
            
            {/* File Path Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Or Enter Server File Path
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={filePath}
                  onChange={e => setFilePath(e.target.value)}
                  placeholder="/path/to/audio/file.wav"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  aria-label="Server file path"
                />
                <Button
                  variant="secondary"
                  onClick={transcribeFromPath}
                  loading={isTranscribing}
                  disabled={!filePath || isTranscribing}
                  aria-label="Transcribe from file path"
                >
                  Transcribe Path
                </Button>
              </div>
            </div>
            
            {/* Timing Display */}
            {(isTranscribing || isSummarizing || isExtractingActions) && (
              <div className="flex gap-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                {isTranscribing && transcribeTime > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="font-medium text-gray-900 dark:text-white">Transcribing: {formatTime(transcribeTime)}</span>
                  </div>
                )}
                {isSummarizing && summarizeTime > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="font-medium text-gray-900 dark:text-white">Summarizing: {formatTime(summarizeTime)}</span>
                  </div>
                )}
                {isExtractingActions && actionItemsTime > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="font-medium text-gray-900 dark:text-white">Extracting: {formatTime(actionItemsTime)}</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                onClick={transcribeFile}
                loading={isTranscribing}
                disabled={(!file && !pasted) || isTranscribing}
                aria-label="Transcribe meeting recording"
              >
                {isTranscribing ? 'Transcribing...' : 'Transcribe'}
              </Button>
              
              {isTranscribing && (
                <Button
                  variant="danger"
                  onClick={cancelTranscription}
                  aria-label="Cancel transcription"
                >
                  Cancel
                </Button>
              )}
              
              <Button
                variant="secondary"
                onClick={doSummarize}
                loading={isSummarizing}
                disabled={!transcript || isSummarizing}
                aria-label="Generate meeting summary"
              >
                {isSummarizing ? 'Summarizing...' : 'Summarize'}
              </Button>
              
              <Button
                variant="secondary"
                onClick={extractActionItems}
                loading={isExtractingActions}
                disabled={!transcript || isExtractingActions}
                aria-label="Extract action items from meeting"
              >
                {isExtractingActions ? 'Extracting...' : 'Extract Actions'}
              </Button>
              
              <Button
                variant="success"
                onClick={saveMeeting}
                disabled={!transcript}
                aria-label="Save meeting"
              >
                💾 Save Meeting
              </Button>

              {/* Auto-save toggle/status */}
              <div className="flex items-center gap-3 ml-2">
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={autosaveEnabled}
                    onChange={e => setAutosaveEnabled(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600"
                    aria-label="Toggle auto-save"
                  />
                  Auto-save
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400" aria-live="polite">
                  {isAutoSaving ? 'Saving…' : lastSavedAt ? `Saved at ${lastSavedAt.toLocaleTimeString()}` : savedMeetingId ? 'Saved' : 'Not saved'}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
        
        {/* Transcript Section */}
        {transcript && (
          <Card 
            aria-label="Meeting transcript"
            elevated
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Transcript
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {transcript.split(/\s+/).length} words, {transcript.length} characters
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(transcript, 'Transcript')}
                    aria-label="Copy transcript to clipboard">
                    📋 Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadText('transcript.txt', transcript)}
                    aria-label="Download transcript">
                    ⬇ Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div className="prose dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-96">
                  {transcript}
                </pre>
              </div>
            </CardBody>
          </Card>
        )}
        
        {/* Summary Section */}
        {summary && (
          <Card 
            aria-label="Meeting summary"
            elevated
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Summary
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(summary, 'Summary')}
                    aria-label="Copy summary to clipboard">
                    📋 Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadText('summary.md', `# Summary\n\n${summary}`)}
                    aria-label="Download summary">
                    ⬇ Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {summary}
              </p>
            </CardBody>
          </Card>
        )}
        
        {/* Action Items Analysis Section */}
        {(actionItems.length > 0 || decisions.length > 0 || keyTopics.length > 0) && (
          <Card 
            aria-label="Meeting analysis"
            elevated
          >
            <CardHeader>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Meeting Analysis
              </h3>
              <div className="flex gap-2 mt-2 flex-wrap">
                {actionItems.length > 0 && (
                  <Badge variant="primary" aria-label={`${actionItems.length} action items`}>{actionItems.length} Action Items</Badge>
                )}
                {decisions.length > 0 && (
                  <Badge variant="success" aria-label={`${decisions.length} decisions`}>{decisions.length} Decisions</Badge>
                )}
                {keyTopics.length > 0 && (
                  <Badge variant="secondary" aria-label={`${keyTopics.length} key topics`}>{keyTopics.length} Topics</Badge>
                )}
              </div>
            </CardHeader>
            <CardBody className="space-y-6">
              {/* Action Items */}
              {actionItems.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                    Action Items
                  </h4>
                  <div className="space-y-2">
                    {actionItems.map((item, idx) => (
                      <div key={idx} className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.text || item.task}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.owner && (
                            <span className="text-xs px-2 py-1 bg-white dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300">
                              👤 {item.owner}
                            </span>
                          )}
                          {item.due_date && (
                            <span className="text-xs px-2 py-1 bg-white dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300">
                              ⏰ {item.due_date}
                            </span>
                          )}
                          {item.priority && (
                            <Badge variant="warning" size="sm">{item.priority}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Decisions */}
              {decisions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <span className="w-2 h-2 bg-success-500 rounded-full mr-2"></span>
                    Decisions Made
                  </h4>
                  <div className="space-y-2">
                    {decisions.map((item, idx) => (
                      <div key={idx} className="p-3 bg-success-50 dark:bg-success-900/20 rounded-lg border border-success-200 dark:border-success-800">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {item.text || item.decision}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Key Topics */}
              {keyTopics.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <span className="w-2 h-2 bg-secondary-500 rounded-full mr-2"></span>
                    Key Topics
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {keyTopics.map((item, idx) => (
                      <Badge key={idx} variant="secondary">
                        {item.text || item.topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        )}
        
        {/* Meetings List */}
        <Card 
          aria-label="Recent meetings list"
          elevated
        >
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Recent Meetings
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {filteredMeetings.length} of {totalMeetings} meetings
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={fetchMeetings}
                  aria-label="Refresh meetings list">
                  🔄 Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={fetchStatus} loading={isLoadingStatus}
                  aria-label="Fetch system status">
                  📊 Status
                </Button>
                <Button 
                  variant={isBulkMode ? "primary" : "outline"} 
                  size="sm" 
                  onClick={() => {
                    setIsBulkMode(!isBulkMode)
                    if (isBulkMode) clearSelection()
                  }}
                  aria-label={isBulkMode ? "Exit bulk mode" : "Enter bulk mode"}
                >
                  {isBulkMode ? '✅ Bulk Mode' : '☑️ Select'}
                </Button>
                <Button 
                  variant={autoRefresh ? "success" : "outline"} 
                  size="sm" 
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  aria-label={autoRefresh ? "Disable auto-refresh" : "Enable auto-refresh"}
                >
                  {autoRefresh ? '🔄 Auto-refresh ON' : '⏸️ Auto-refresh OFF'}
                </Button>
              </div>
            </div>
            
            {/* Bulk Actions Toolbar */}
            {isBulkMode && (
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={selectAllMeetings}
                    aria-label="Select all meetings">
                    ☑️ Select All ({paginatedMeetings.length})
                  </Button>
                  {selectedMeetings.size > 0 && (
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedMeetings.size} selected
                    </span>
                  )}
                </div>
                {selectedMeetings.size > 0 && (
                  <div className="flex gap-2">
                    <Button variant="danger" size="sm" onClick={bulkDelete}
                      aria-label="Delete selected meetings">
                      🗑️ Delete Selected
                    </Button>
                    <Button variant="primary" size="sm" onClick={bulkExport}
                      aria-label="Export selected meetings">
                      📥 Export Selected
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearSelection}
                      aria-label="Clear selection">
                      Clear
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Auto-refresh Settings */}
            {autoRefresh && (
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Refresh every:</span>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  aria-label="Auto-refresh interval"
                >
                  <option value="10">10 seconds</option>
                  <option value="30">30 seconds</option>
                  <option value="60">1 minute</option>
                  <option value="300">5 minutes</option>
                </select>
              </div>
            )}
            
            {/* Advanced Filters */}
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700">
                🔍 Advanced Filters
              </summary>
              <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      From Date:
                    </label>
                    <input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      aria-label="Filter from date"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      To Date:
                    </label>
                    <input
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      aria-label="Filter to date"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterHasActions}
                      onChange={(e) => setFilterHasActions(e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      aria-label="Filter meetings with action items"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Only meetings with action items</span>
                  </label>
                </div>
              </div>
            </details>
            
            {/* Search and Filter Bar */}
            <div className="mt-4 space-y-3">
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search meetings by title, summary, or transcript..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           placeholder-gray-400 dark:placeholder-gray-500
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  aria-label="Search meetings"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label="Clear search"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Filters Row */}
              <div className="flex flex-wrap gap-3">
                {/* Date Filter */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date:
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                             focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    aria-label="Filter by date"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Past Week</option>
                    <option value="month">Past Month</option>
                  </select>
                </div>
                
                {/* Sort By */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sort:
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                             focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    aria-label="Sort meetings"
                  >
                    <option value="date_desc">Newest First</option>
                    <option value="date_asc">Oldest First</option>
                    <option value="title">Title A-Z</option>
                  </select>
                </div>
                
                {/* Clear Filters */}
                {(searchQuery || dateFilter !== 'all' || sortBy !== 'date_desc') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('')
                      setDateFilter('all')
                      setSortBy('date_desc')
                      toast.success('Filters cleared')
                    }}
                    aria-label="Clear all filters"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardBody>
            {isLoadingMeetings ? (
              <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : paginatedMeetings.length > 0 ? (
              <>
                <div className="space-y-3">
                  {paginatedMeetings.map(meeting => (
                  <div
                    key={meeting.id}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow"
                    aria-label={`Meeting: ${meeting.title}`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      {/* Bulk Select Checkbox */}
                      {isBulkMode && (
                        <input
                          type="checkbox"
                          checked={selectedMeetings.has(meeting.id)}
                          onChange={() => toggleMeetingSelection(meeting.id)}
                          className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          aria-label={`Select meeting ${meeting.title}`}
                        />
                      )}
                      
                      <div className="flex-1">
                        {editingMeetingId === meeting.id ? (
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') updateMeetingTitle(meeting.id)
                                if (e.key === 'Escape') cancelEditingTitle()
                              }}
                              className="flex-1 px-3 py-1.5 border border-primary-300 dark:border-primary-600 rounded-lg
                                       bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                                       focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="Meeting title..."
                              autoFocus
                              aria-label="Edit meeting title"
                            />
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => updateMeetingTitle(meeting.id)}
                              aria-label="Save meeting title"
                            >
                              Save
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEditingTitle}
                              aria-label="Cancel editing"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {meeting.title}
                            </h4>
                            <button
                              onClick={() => startEditingTitle(meeting)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                              title="Edit title"
                              aria-label={`Edit title for ${meeting.title}`}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </div>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {new Date(meeting.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2 items-start">
                        {meeting.action_items?.length > 0 && (
                          <Badge variant="primary" aria-label={`${meeting.action_items.length} action items`}>
                            {meeting.action_items.length} actions
                          </Badge>
                        )}
                        {meeting.decisions?.length > 0 && (
                          <Badge variant="secondary" aria-label={`${meeting.decisions.length} decisions`}>
                            {meeting.decisions.length} decisions
                          </Badge>
                        )}
                        {meeting.key_topics?.length > 0 && (
                          <Badge variant="secondary" aria-label={`${meeting.key_topics.length} key topics`}>
                            {meeting.key_topics.length} topics
                          </Badge>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => deleteMeeting(meeting.id)}
                          loading={deletingMeetingId === meeting.id}
                          disabled={deletingMeetingId === meeting.id}
                          aria-label={`Delete meeting ${meeting.title}`}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    {meeting.summary && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">
                        {meeting.summary}
                      </p>
                    )}
                    
                    {/* Expandable Details */}
                    {meeting.action_items && meeting.action_items.length > 0 && (
                      <div className="mt-3">
                        <button
                          onClick={() => toggleMeetingExpansion(meeting.id)}
                          className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 flex items-center gap-1"
                          aria-expanded={expandedMeetings[meeting.id]}
                          aria-label={expandedMeetings[meeting.id] ? `Hide action items for ${meeting.title}` : `Show action items for ${meeting.title}`}
                        >
                          {expandedMeetings[meeting.id] ? '▼' : '▶'} 
                          {expandedMeetings[meeting.id] ? 'Hide' : 'Show'} Action Items ({meeting.action_items.length})
                        </button>
                        
                        {expandedMeetings[meeting.id] && (
                          <div className="mt-2 space-y-2 pl-4">
                            {meeting.action_items.map((item, idx) => (
                              <div key={idx} className="p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-sm">
                                <p className="text-gray-900 dark:text-white">{item.text || item.task || item}</p>
                                <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400">
                                  {item.owner && item.owner !== 'Unassigned' && (
                                    <span>👤 {item.owner}</span>
                                  )}
                                  {item.assignee && item.assignee !== 'Unassigned' && (
                                    <span>👤 {item.assignee}</span>
                                  )}
                                  {item.deadline && item.deadline !== 'No deadline specified' && (
                                    <span>📅 {item.deadline}</span>
                                  )}
                                  {item.priority && (
                                    <span className={`px-1 py-0.5 rounded text-xs ${
                                      item.priority === 'P1' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                      item.priority === 'P2' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                    }`}>
                                      {item.priority}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Decisions Made */}
                    {meeting.decisions && meeting.decisions.length > 0 && (
                      <div className="mt-3">
                        <button
                          onClick={() => setExpandedMeetings(prev => ({
                            ...prev,
                            [meeting.id]: !prev[meeting.id]
                          }))}
                          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                        >
                          <span className="text-lg">
                            {expandedMeetings[meeting.id] ? '▼' : '▶'} 
                          </span>
                          {expandedMeetings[meeting.id] ? 'Hide' : 'Show'} Decisions Made ({meeting.decisions.length})
                        </button>
                        
                        {expandedMeetings[meeting.id] && (
                          <div className="mt-2 space-y-2 pl-4">
                            {meeting.decisions.map((decision, idx) => (
                              <div key={idx} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800 text-sm">
                                <p className="text-gray-900 dark:text-white font-medium">{decision.decision || decision}</p>
                                {decision.decision_maker && decision.decision_maker !== 'Not specified' && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">👤 {decision.decision_maker}</p>
                                )}
                                {decision.impact && decision.impact !== 'Not specified' && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400">💡 {decision.impact}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Key Topics */}
                    {meeting.key_topics && meeting.key_topics.length > 0 && (
                      <div className="mt-3">
                        <button
                          onClick={() => setExpandedMeetings(prev => ({
                            ...prev,
                            [meeting.id]: !prev[meeting.id]
                          }))}
                          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                        >
                          <span className="text-lg">
                            {expandedMeetings[meeting.id] ? '▼' : '▶'} 
                          </span>
                          {expandedMeetings[meeting.id] ? 'Hide' : 'Show'} Key Topics ({meeting.key_topics.length})
                        </button>
                        
                        {expandedMeetings[meeting.id] && (
                          <div className="mt-2 space-y-2 pl-4">
                            {meeting.key_topics.map((topic, idx) => (
                              <div key={idx} className="p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800 text-sm">
                                <p className="text-gray-900 dark:text-white font-medium">{topic.topic || topic}</p>
                                {topic.description && topic.description !== 'No description provided' && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{topic.description}</p>
                                )}
                                {topic.importance_level && (
                                  <span className={`inline-block px-2 py-1 rounded text-xs mt-1 ${
                                    topic.importance_level === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                    topic.importance_level === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                  }`}>
                                    {topic.importance_level}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  ))}
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 dark:text-gray-400">
                        Per page:
                      </label>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value))
                          setCurrentPage(1)
                        }}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded
                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                        aria-label="Items per page"
                      >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                      </select>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredMeetings.length)} of {filteredMeetings.length}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        aria-label="Go to first page"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        aria-label="Go to previous page"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </Button>
                      
                      {/* Page Numbers */}
                      <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            // Show first page, last page, current page, and adjacent pages
                            return page === 1 || 
                                   page === totalPages || 
                                   Math.abs(page - currentPage) <= 1
                          })
                          .map((page, idx, arr) => (
                            <React.Fragment key={page}>
                              {idx > 0 && arr[idx - 1] !== page - 1 && (
                                <span className="px-2 text-gray-400">...</span>
                              )}
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={`
                                  px-3 py-1 rounded text-sm font-medium transition-colors
                                  ${page === currentPage 
                                    ? 'bg-primary-600 text-white' 
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                  }
                                `}
                                aria-current={page === currentPage ? "page" : undefined}
                                aria-label={`Go to page ${page}`}
                              >
                                {page}
                              </button>
                            </React.Fragment>
                          ))}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        aria-label="Go to next page"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        aria-label="Go to last page"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                {searchQuery || dateFilter !== 'all' ? (
                  <div>
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium">No meetings match your filters</p>
                    <p className="text-sm mt-1">Try adjusting your search or filter settings</p>
                  </div>
                ) : (
                  <div>
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <p className="font-medium">No meetings yet</p>
                    <p className="text-sm mt-1">Upload a recording to get started!</p>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </Layout>
  )
}
