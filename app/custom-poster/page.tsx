/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable prefer-const */
'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Upload, ShoppingBag, ArrowLeft, Info, Type, Settings, Crop,
  Undo2, Redo2, RotateCcw, Save, Trash2, Layers, Sparkles, Check,
  Loader2, Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  Eye, Monitor, Frame, Image as ImageIcon, CheckCircle2, ChevronRight,
  Maximize2, RefreshCw, ZoomIn, Compass, ShieldCheck
} from 'lucide-react';
import Image from 'next/image';
import { 
  POSTER_SIZES, 
  calculateCustomPosterPrice 
} from '@/lib/customPosterPricing';
import PosterSizeReference from '@/components/PosterSizeReference';
import CyberCursorTrail from '@/components/CyberCursorTrail';

// Custom fonts loaded dynamically
const AVAILABLE_FONTS = ['Outfit', 'Cinzel', 'Anton', 'Montserrat', 'Special Elite'];

// Curated starter artworks in Cyberpunk & Aesthetic styles for Step 01
const CURATED_PRESETS = [
  {
    id: 'cyber-samurai',
    title: 'Neon Cyber Samurai',
    category: 'Cyberpunk',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    accent: '#00E5FF'
  },
  {
    id: 'skyline-gtr',
    title: 'Synthwave Skyline GT-R',
    category: 'Retro Future',
    url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
    accent: '#287BFF'
  },
  {
    id: 'tokyo-drift',
    title: 'Tokyo Rain Drift',
    category: 'JDM Legend',
    url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
    accent: '#00E5FF'
  },
  {
    id: 'arcade-schematic',
    title: 'Retro Arcade Schematic',
    category: 'Gaming Tech',
    url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
    accent: '#38BDF8'
  },
  {
    id: 'circuit-matrix',
    title: 'Neural Matrix Grid',
    category: 'Sci-Fi Abstract',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    accent: '#287BFF'
  },
  {
    id: 'abstract-nebula',
    title: 'Deep Cyber Nebula',
    category: 'Aesthetic Art',
    url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80',
    accent: '#B9F4FF'
  }
];

function ConfiguratorContent() {
  const { addToCart, refreshCart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Builder configurations
  const [sizeName, setSizeName] = useState<string>('A4');
  const [paperType, setPaperType] = useState<string>('Matte');
  const [frameName, setFrameName] = useState<string>('No Frame');
  const [orientation, setOrientation] = useState<'PORTRAIT' | 'LANDSCAPE'>('PORTRAIT');
  const [quantity, setQuantity] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'canvas' | 'gallery'>('canvas');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Edit / Cart reference states
  const [cartItemId, setCartItemId] = useState<string | null>(null);
  const [customPosterId, setCustomPosterId] = useState<string | null>(null);

  // Canvas details
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<any>(null);
  const [activeObject, setActiveObject] = useState<any>(null);
  const [fabricModule, setFabricModule] = useState<any>(null);
  const fabricCanvasRef = useRef<any>(null);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const triggerReactUpdate = () => setUpdateTrigger(prev => prev + 1);

  // Drag and drop zone active state
  const [isDragOver, setIsDragOver] = useState(false);

  // Cyberpunk Blue Selection Controls
  const setCustomControls = (obj: any) => {
    if (!obj) return;
    obj.set({
      borderColor: '#00E5FF',
      cornerColor: '#287BFF',
      cornerStrokeColor: '#B9F4FF',
      cornerSize: 10,
      cornerStyle: 'circle',
      transparentCorners: false,
      padding: 5,
      rotatingPointOffset: 25,
    });
    obj.hasControls = true;
    obj.hasBorders = true;
    obj.selectable = true;
  };

  // Undo / Redo / Change status
  const isStateChanging = useRef(false);
  const history = useRef<string[]>([]);
  const historyIndex = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Saved designs drawer & loading
  const [savedDesigns, setSavedDesigns] = useState<any[]>([]);
  const [isDesignsLoading, setIsDesignsLoading] = useState(false);
  const [saveDesignName, setSaveDesignName] = useState('');
  const [isSavingDesign, setIsSavingDesign] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Image Uploading / API processing states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Text inputs
  const [textInput, setTextInput] = useState('');

  // Tab configurations
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'size' | 'text' | 'saved'>('presets');

  // Sticky bottom bar visibility
  const [showFloatingBar, setShowFloatingBar] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!workspaceRef.current) return;
      const rect = workspaceRef.current.getBoundingClientRect();
      // Show floating bar when scrolled into workspace and on mobile/desktop
      setShowFloatingBar(rect.top < 0 && rect.bottom > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load Fabric client-side
  useEffect(() => {
    let isMounted = true;
    let canvas: any = null;

    import('fabric').then((module) => {
      if (!isMounted || !canvasRef.current) return;
      
      setFabricModule(module);
      const f = module.fabric;
      
      // Prevent tainted canvas errors by defaulting all Fabric images to use anonymous CORS
      f.Image.prototype.crossOrigin = 'anonymous';
      
      // Prevent wrapping the canvas element multiple times
      if (canvasRef.current.classList.contains('lower-canvas') || (canvasRef.current.parentNode as HTMLElement)?.classList?.contains('canvas-container')) {
        return;
      }
      
      canvas = new f.Canvas(canvasRef.current, {
        width: 360,
        height: 509,
        backgroundColor: '#050816',
        preserveObjectStacking: true,
      });
      fabricCanvasRef.current = canvas;

      // Apply initial clipping box
      const clipRect = new f.Rect({
        left: 0,
        top: 0,
        width: 360,
        height: 509,
        absolutePositioned: true
      });
      canvas.clipPath = clipRect;

      // Event listeners
      const handleSelection = () => {
        if (!isMounted) return;
        setActiveObject(canvas.getActiveObject());
      };

      canvas.on('selection:created', handleSelection);
      canvas.on('selection:updated', handleSelection);
      canvas.on('selection:cleared', () => {
        if (!isMounted) return;
        setActiveObject(null);
      });
      canvas.on('object:modified', handleSelection);

      const updateHistory = () => {
        if (!isMounted || isStateChanging.current) return;
        
        const state = JSON.stringify(canvas.toJSON());
        if (historyIndex.current < history.current.length - 1) {
          history.current = history.current.slice(0, historyIndex.current + 1);
        }
        
        history.current.push(state);
        historyIndex.current = history.current.length - 1;
        
        setCanUndo(historyIndex.current > 0);
        setCanRedo(historyIndex.current < history.current.length - 1);
        setHasUnsavedChanges(true);
      };

      canvas.on('object:added', updateHistory);
      canvas.on('object:modified', updateHistory);
      canvas.on('object:removed', updateHistory);

      setFabricCanvas(canvas);
      
      // Seed first history state
      const initialState = JSON.stringify(canvas.toJSON());
      history.current = [initialState];
      historyIndex.current = 0;
    });

    return () => {
      isMounted = false;
      if (canvas) {
        canvas.dispose();
      } else if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, []);

  // Sync aspect ratio when sizeName/orientation changes
  useEffect(() => {
    if (!fabricCanvas || !fabricModule) return;

    const size = POSTER_SIZES.find(s => s.name === sizeName);
    let aspectRatio = size ? size.aspectRatio : 21 / 29.7; // default A4

    let canvasWidth = 360;
    let canvasHeight = 509;

    if (orientation === 'PORTRAIT') {
      canvasHeight = Math.round(canvasWidth / aspectRatio);
    } else {
      // LANDSCAPE
      canvasHeight = Math.round(canvasWidth * aspectRatio);
    }

    fabricCanvas.setDimensions({ width: canvasWidth, height: canvasHeight });
    
    // Update clipping box to match new size dimensions
    const f = fabricModule.fabric;
    const clipRect = new f.Rect({
      left: 0,
      top: 0,
      width: canvasWidth,
      height: canvasHeight,
      absolutePositioned: true
    });
    fabricCanvas.clipPath = clipRect;
    
    fabricCanvas.renderAll();
  }, [sizeName, orientation, fabricCanvas, fabricModule]);

  // Load edit item parameter if present
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && fabricCanvas) {
      setCartItemId(editId);
      fetch('/api/cart')
        .then(res => res.json())
        .then(data => {
          if (data.items) {
            const item = data.items.find((i: any) => i.id === editId);
            if (item && item.customPosterId) {
              setCustomPosterId(item.customPosterId);
              setSizeName(item.sizeName);
              setPaperType(item.paperType);
              setFrameName(item.frameName);
              if (item.orientation) {
                setOrientation(item.orientation);
              }
              
              if (item.configuration) {
                isStateChanging.current = true;
                fabricCanvas.loadFromJSON(item.configuration, () => {
                  fabricCanvas.getObjects().forEach((obj: any) => {
                    setCustomControls(obj);
                  });
                  fabricCanvas.renderAll();
                  isStateChanging.current = false;
                  
                  // Setup history stack
                  history.current = [JSON.stringify(fabricCanvas.toJSON())];
                  historyIndex.current = 0;
                  setCanUndo(false);
                  setCanRedo(false);
                  setHasUnsavedChanges(false);
                });
              }
            }
          }
        })
        .catch(err => console.error("Failed to load custom poster configurations:", err));
    }
  }, [searchParams, fabricCanvas]);

  // Load user saved designs
  const loadSavedDesigns = async () => {
    try {
      setIsDesignsLoading(true);
      const res = await fetch('/api/custom-poster/designs');
      if (res.ok) {
        const data = await res.json();
        if (data.designs) {
          setSavedDesigns(data.designs);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDesignsLoading(false);
    }
  };

  useEffect(() => {
    loadSavedDesigns();
  }, []);

  // Pricing calculations synchronized with backend
  const priceBreakdown = useMemo(() => {
    const unitPrice = calculateCustomPosterPrice({ sizeName });
    return {
      unitPrice,
      total: unitPrice * quantity
    };
  }, [sizeName, quantity]);

  // Load a curated starter preset image onto canvas
  const handleLoadPreset = (preset: typeof CURATED_PRESETS[0]) => {
    if (!fabricCanvas || !fabricModule) return;
    const f = fabricModule.fabric;

    setSelectedPresetId(preset.id);
    setErrorMsg(null);
    setSuccessMsg(`"${preset.title}" loaded onto studio canvas.`);

    f.Image.fromURL(preset.url, (img: any) => {
      const canvasWidth = fabricCanvas.getWidth();
      const canvasHeight = fabricCanvas.getHeight();

      // Clear existing images if loading new starter
      const existingImages = fabricCanvas.getObjects().filter((o: any) => o.type === 'image');
      existingImages.forEach((imgObj: any) => fabricCanvas.remove(imgObj));

      // Fit image cover
      const scaleX = canvasWidth / img.width;
      const scaleY = canvasHeight / img.height;
      const maxScale = Math.max(scaleX, scaleY);

      img.scale(maxScale);
      img.set({
        left: (canvasWidth - img.width * maxScale) / 2,
        top: (canvasHeight - img.height * maxScale) / 2,
        cloudinaryUrl: preset.url,
      });

      setCustomControls(img);
      fabricCanvas.add(img);
      fabricCanvas.sendToBack(img);
      fabricCanvas.setActiveObject(img);
      fabricCanvas.renderAll();
      triggerReactUpdate();
    }, { crossOrigin: 'anonymous' });
  };

  const handleRotateActive = (angleDelta: number) => {
    if (!activeObject || !fabricCanvas) return;
    const currentAngle = activeObject.get('angle') || 0;
    const nextAngle = (currentAngle + angleDelta) % 360;
    activeObject.set('angle', nextAngle);
    activeObject.setCoords();
    fabricCanvas.renderAll();
    fabricCanvas.fire('object:modified', { target: activeObject });
    triggerReactUpdate();
  };

  // Add caption text
  const addTextElement = () => {
    if (!fabricCanvas || !fabricModule || !textInput.trim()) return;
    
    const f = fabricModule.fabric;
    const textObj = new f.IText(textInput, {
      left: 50,
      top: 160,
      fontSize: 26,
      fontFamily: 'Outfit',
      fill: '#00E5FF',
      fontWeight: 'bold',
    });

    setCustomControls(textObj);
    fabricCanvas.add(textObj);
    fabricCanvas.setActiveObject(textObj);
    fabricCanvas.renderAll();
    setTextInput('');
    setSuccessMsg('Typography overlay added to canvas.');
  };

  // Change active text configurations
  const updateActiveText = (key: string, value: any) => {
    if (!activeObject) return;
    activeObject.set(key, value);
    fabricCanvas.renderAll();
    fabricCanvas.fire('object:modified', { target: activeObject });
    triggerReactUpdate();
  };

  const toggleBold = () => {
    if (!activeObject) return;
    const current = activeObject.get('fontWeight');
    updateActiveText('fontWeight', current === 'bold' ? 'normal' : 'bold');
  };

  const toggleItalic = () => {
    if (!activeObject) return;
    const current = activeObject.get('fontStyle');
    updateActiveText('fontStyle', current === 'italic' ? 'normal' : 'italic');
  };

  // Process raw file upload (from input or drag-and-drop)
  const processUploadedFile = async (file: File) => {
    if (!file || !fabricCanvas || !fabricModule) return;

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg("File exceeds the 15MB limit. Please choose a smaller file.");
      return;
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Invalid file type. Please upload a PNG, JPG, or WEBP image.");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    const f = fabricModule.fabric;

    setIsUploading(true);
    setUploadProgress(25);
    setErrorMsg(null);
    setSelectedPresetId(null);

    // Instant preview local blob on canvas
    f.Image.fromURL(localUrl, (img: any) => {
      const canvasWidth = fabricCanvas.getWidth();
      const canvasHeight = fabricCanvas.getHeight();

      const scaleX = canvasWidth / img.width;
      const scaleY = canvasHeight / img.height;
      const maxScale = Math.max(scaleX, scaleY) * 0.95;

      img.scale(maxScale);
      img.set({
        left: (canvasWidth - img.width * maxScale) / 2,
        top: (canvasHeight - img.height * maxScale) / 2,
      });
      img.set('blobUrl', localUrl);
      setCustomControls(img);
      fabricCanvas.add(img);
      fabricCanvas.setActiveObject(img);
      fabricCanvas.renderAll();
      setUploadProgress(60);
    }, { crossOrigin: 'anonymous' });

    // Upload to server Cloudinary API in background
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setUploadProgress(100);

      if (res.ok && data.success) {
        // Swap preview blob URL with the permanent Cloudinary URL
        const objects = fabricCanvas.getObjects();
        const addedImg = objects.find((obj: any) => obj.get('blobUrl') === localUrl);
        if (addedImg) {
          addedImg.setSrc(data.url, () => {
            addedImg.set('blobUrl', null);
            addedImg.set('cloudinaryUrl', data.url);
            addedImg.set('publicId', data.publicId);
            fabricCanvas.renderAll();
            fabricCanvas.fire('object:modified', { target: addedImg });
          }, { crossOrigin: 'anonymous' });
        }
        setSuccessMsg("Artwork securely synced and stabilized with Cloudinary CDN.");
      } else {
        setErrorMsg(data.error || "Failed to permanently store image.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network failure during upload. Canvas is still usable locally.");
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processUploadedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processUploadedFile(file);
  };

  // Undo / Redo engine
  const handleUndo = () => {
    if (historyIndex.current > 0 && fabricCanvas) {
      isStateChanging.current = true;
      historyIndex.current--;
      const state = history.current[historyIndex.current];
      fabricCanvas.loadFromJSON(state, () => {
        fabricCanvas.getObjects().forEach((obj: any) => {
          setCustomControls(obj);
        });
        fabricCanvas.renderAll();
        isStateChanging.current = false;
        setCanUndo(historyIndex.current > 0);
        setCanRedo(historyIndex.current < history.current.length - 1);
      });
    }
  };

  const handleRedo = () => {
    if (historyIndex.current < history.current.length - 1 && fabricCanvas) {
      isStateChanging.current = true;
      historyIndex.current++;
      const state = history.current[historyIndex.current];
      fabricCanvas.loadFromJSON(state, () => {
        fabricCanvas.getObjects().forEach((obj: any) => {
          setCustomControls(obj);
        });
        fabricCanvas.renderAll();
        isStateChanging.current = false;
        setCanUndo(historyIndex.current > 0);
        setCanRedo(historyIndex.current < history.current.length - 1);
      });
    }
  };

  const handleReset = () => {
    if (!fabricCanvas || !fabricModule) return;
    if (window.confirm("Reset studio canvas? All unsaved artwork changes will be cleared.")) {
      isStateChanging.current = true;
      fabricCanvas.clear();
      fabricCanvas.setBackgroundColor('#050816', () => {
        const clipRect = new fabricModule.fabric.Rect({
          left: 0,
          top: 0,
          width: fabricCanvas.getWidth(),
          height: fabricCanvas.getHeight(),
          absolutePositioned: true
        });
        fabricCanvas.clipPath = clipRect;
        fabricCanvas.renderAll();
        isStateChanging.current = false;

        history.current = [JSON.stringify(fabricCanvas.toJSON())];
        historyIndex.current = 0;
        setCanUndo(false);
        setCanRedo(false);
        setHasUnsavedChanges(false);
        setSelectedPresetId(null);
        setSuccessMsg("Studio canvas reset to blank state.");
      });
    }
  };

  // Layer order actions
  const changeLayer = (action: 'front' | 'back' | 'forward' | 'backward') => {
    if (!activeObject || !fabricCanvas) return;
    if (action === 'front') fabricCanvas.bringToFront(activeObject);
    else if (action === 'back') fabricCanvas.sendToBack(activeObject);
    else if (action === 'forward') fabricCanvas.bringForward(activeObject);
    else if (action === 'backward') fabricCanvas.sendBackward(activeObject);
    fabricCanvas.renderAll();
    fabricCanvas.fire('object:modified', { target: activeObject });
  };

  // Helper to export canvas preview to Cloudinary
  const uploadCanvasThumbnail = async (): Promise<string> => {
    if (!fabricCanvas) throw new Error("Canvas not ready");
    
    // Clear selection borders for clean render
    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();

    const base64Data = fabricCanvas.toDataURL({
      format: 'png',
      quality: 0.90
    });

    const resBlob = await fetch(base64Data);
    const blob = await resBlob.blob();
    const file = new File([blob], 'cyberpunk-poster-preview.png', { type: 'image/png' });
    
    const formData = new FormData();
    formData.append('file', file);
    
    const uploadRes = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    const data = await uploadRes.json();
    if (!uploadRes.ok || !data.success) {
      throw new Error(data.error || "Failed to render poster preview.");
    }
    return data.url;
  };

  // Save design action
  const handleSaveDesign = async () => {
    if (!saveDesignName.trim()) return;

    try {
      setIsSavingDesign(true);
      setErrorMsg(null);

      const previewUrl = await uploadCanvasThumbnail();
      const configuration = fabricCanvas.toJSON();

      const res = await fetch('/api/custom-poster/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveDesignName.trim(),
          configuration,
          previewImage: previewUrl
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Design "${saveDesignName}" saved to your profile library!`);
        setShowSaveModal(false);
        setSaveDesignName('');
        setHasUnsavedChanges(false);
        loadSavedDesigns();
      } else {
        setErrorMsg(data.error || "Failed to save design layout.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to save design.");
    } finally {
      setIsSavingDesign(false);
    }
  };

  // Add to Cart
  const handleAddToCart = async () => {
    try {
      setIsAddingToCart(true);
      setErrorMsg(null);

      // Check if canvas has at least one element or image
      if (fabricCanvas && fabricCanvas.getObjects().length === 0) {
        setErrorMsg("Your canvas is currently empty. Please choose a preset or upload an artwork before ordering.");
        setIsAddingToCart(false);
        return;
      }

      // 1. Upload preview image
      const previewUrl = await uploadCanvasThumbnail();
      const configuration = fabricCanvas.toJSON();

      // 2. Call Cart POST API
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: 'custom-poster-placeholder',
          quantity,
          customPosterId, // passed if editing
          customPoster: {
            imageUrl: previewUrl,
            orientation,
            sizeName,
            frameName,
            paperType,
            configuration,
          }
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(cartItemId ? "Customizations successfully updated!" : "Poster added to your cart!");
        setHasUnsavedChanges(false);
        await refreshCart();
        router.push('/cart');
      } else {
        setErrorMsg(data.error || "Could not add poster configuration to cart.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Network error during checkout.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Load previously saved design
  const loadSavedConfig = (design: any) => {
    if (!fabricCanvas) return;
    if (window.confirm(`Load saved design "${design.name}"? This will overwrite the current canvas.`)) {
      isStateChanging.current = true;
      fabricCanvas.loadFromJSON(design.configuration, () => {
        fabricCanvas.getObjects().forEach((obj: any) => {
          setCustomControls(obj);
        });
        fabricCanvas.renderAll();
        isStateChanging.current = false;
        
        history.current = [JSON.stringify(fabricCanvas.toJSON())];
        historyIndex.current = 0;
        setCanUndo(false);
        setCanRedo(false);
        setHasUnsavedChanges(false);
        setSuccessMsg(`Loaded "${design.name}" successfully.`);
      });
    }
  };

  // Delete saved design
  const deleteSavedConfig = async (e: React.MouseEvent, designId: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this saved design?")) {
      try {
        const res = await fetch(`/api/custom-poster/designs?id=${designId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          loadSavedDesigns();
          setSuccessMsg("Design removed from your profile.");
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Confirm leave page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes in your design. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const activeSize = POSTER_SIZES.find(s => s.name === sizeName) || POSTER_SIZES[2];

  return (
    <div className="min-h-screen bg-[#050816] text-[#F4F8FF] flex flex-col font-sans selection:bg-[#287BFF]/30 selection:text-[#00E5FF] relative overflow-x-hidden">
      {/* Signature Cyberpunk Cursor Trail */}
      <CyberCursorTrail />

      {/* Futuristic Typography Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Cinzel:wght@500;700;900&family=Montserrat:wght@400;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&family=Special+Elite&family=Space+Grotesk:wght@500;700&display=swap');
        
        .cyber-grid {
          background-image: 
            linear-gradient(to right, rgba(40, 123, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(40, 123, 255, 0.05) 1px, transparent 1px);
          background-size: 32px 32px;
        }

        .cyber-glow-border {
          box-shadow: 0 0 20px -5px rgba(40, 123, 255, 0.35), inset 0 0 15px -5px rgba(0, 229, 255, 0.2);
        }

        .cyber-canvas-glow {
          box-shadow: 0 0 35px -5px rgba(40, 123, 255, 0.3), 0 0 1px 1px rgba(0, 229, 255, 0.4);
        }

        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(1000%); }
        }

        .animate-scanline {
          animation: scanline 8s linear infinite;
        }
      `}</style>

      {/* Cyberpunk Blue Ambient Background */}
      <div className="fixed inset-0 cyber-grid pointer-events-none z-0"></div>
      <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#287BFF]/10 via-[#00E5FF]/5 to-transparent blur-[140px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-[#287BFF]/10 via-[#00E5FF]/5 to-transparent blur-[140px] pointer-events-none z-0"></div>

      {/* Main Navigation */}
      <div className="relative z-30">
        <Navbar />
      </div>

      {/* ========================================================================= */}
      {/* 3.A HERO SECTION — CINEMATIC INTRODUCTION */}
      {/* ========================================================================= */}
      <section className="relative z-10 pt-10 pb-12 px-4 sm:px-6 max-w-7xl mx-auto w-full text-center">
        {/* Holographic Studio Readiness Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#0A1024]/80 border border-[#287BFF]/30 backdrop-blur-md mb-6 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E5FF] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E5FF]"></span>
          </span>
          <span className="text-[11px] font-mono font-bold tracking-widest text-[#B9F4FF] uppercase">
            STUDIO CORE ONLINE // ARCHIVAL SYNTHESIS ENGINE V4.2
          </span>
        </div>

        {/* Master Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white mb-4 leading-none font-['Montserrat',sans-serif]">
          YOUR WALL. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] via-[#287BFF] to-[#B9F4FF]">YOUR UNIVERSE.</span>
        </h1>

        {/* Supporting Copy */}
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#91A4C7] leading-relaxed mb-8">
          Transform your digital artwork, photos, and cybernetic visions into physical museum-grade wall posters.
          Printed with ultra-density pigment inks on archival 300 GSM heavy-stock paper.
        </p>

        {/* Readiness Metric Strip */}
        <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'FORMATS', val: 'A3, A4, A5, A6' },
            { label: 'FIDELITY', val: '300 DPI LOSSLESS' },
            { label: 'PAPER STOCK', val: '300 GSM MATTE' },
            { label: 'DISPATCH', val: 'EXPRESS SHIPPING' },
          ].map((item, i) => (
            <div key={i} className="p-3 bg-[#0A1024]/60 border border-[#287BFF]/15 rounded-xl backdrop-blur-sm">
              <div className="text-[9px] font-mono text-[#00E5FF] font-bold uppercase tracking-wider">{item.label}</div>
              <div className="text-xs font-bold text-white mt-0.5">{item.val}</div>
            </div>
          ))}
        </div>

        {/* CTA to smoothly jump to workspace */}
        <a
          href="#studio-workspace"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#287BFF] to-[#00E5FF] text-[#050816] font-black text-xs uppercase tracking-widest hover:shadow-[0_0_25px_rgba(0,229,255,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <span>ENTER CUSTOMIZATION STUDIO</span>
          <ChevronRight className="w-4 h-4" />
        </a>
      </section>

      {/* ========================================================================= */}
      {/* 3.B & 3.C REDESIGNED WORKSPACE: PREVIEW CANVAS (LEFT) & CONTROLS (RIGHT) */}
      {/* ========================================================================= */}
      <main id="studio-workspace" ref={workspaceRef} className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pb-20 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* ===================================================================== */}
        {/* LEFT COLUMN: THE INTERACTIVE CANVAS & POSTER PREVIEW */}
        {/* ===================================================================== */}
        <div className="w-full lg:flex-1 flex flex-col bg-[#0A1024]/90 border border-[#287BFF]/25 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative gap-6">
          
          {/* Top Canvas Bar: Navigation, Title & Tool Actions */}
          <div className="w-full flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-[#287BFF]/20 pb-4">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-[#91A4C7] hover:text-[#00E5FF] transition-colors font-bold uppercase tracking-wider"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Storefront
              </Link>
              <div className="h-3 w-[1px] bg-[#287BFF]/30"></div>
              <span className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse"></span>
                {cartItemId ? 'EDIT CUSTOM PRINT' : 'CYBER STUDIO WORKSPACE'}
              </span>
            </div>

            {/* View Mode Toggle: Canvas Editor vs Gallery Wall */}
            <div className="flex items-center gap-2 bg-[#050816] p-1 rounded-xl border border-[#287BFF]/25">
              <button
                type="button"
                onClick={() => setViewMode('canvas')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'canvas'
                    ? 'bg-[#287BFF] text-white shadow-[0_0_12px_rgba(40,123,255,0.5)]'
                    : 'text-[#91A4C7] hover:text-white'
                }`}
              >
                <Monitor className="w-3 h-3" />
                Editor
              </button>
              <button
                type="button"
                onClick={() => setViewMode('gallery')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'gallery'
                    ? 'bg-[#00E5FF] text-[#050816] shadow-[0_0_12px_rgba(0,229,255,0.5)]'
                    : 'text-[#91A4C7] hover:text-white'
                }`}
              >
                <Eye className="w-3 h-3" />
                Gallery View
              </button>
            </div>

            {/* Canvas Actions: Undo, Redo, Reset, Save */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo}
                className="p-2.5 bg-[#101A33] border border-[#287BFF]/25 hover:border-[#00E5FF] disabled:opacity-30 rounded-xl text-[#91A4C7] hover:text-white transition-all cursor-pointer disabled:cursor-not-allowed"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={!canRedo}
                className="p-2.5 bg-[#101A33] border border-[#287BFF]/25 hover:border-[#00E5FF] disabled:opacity-30 rounded-xl text-[#91A4C7] hover:text-white transition-all cursor-pointer disabled:cursor-not-allowed"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="p-2.5 bg-[#101A33] border border-[#287BFF]/25 hover:border-red-500 rounded-xl text-[#91A4C7] hover:text-red-400 transition-all cursor-pointer"
                title="Reset Canvas"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowSaveModal(true)}
                className="p-2.5 bg-[#101A33] border border-[#287BFF]/25 hover:border-[#00E5FF] rounded-xl text-[#91A4C7] hover:text-[#00E5FF] transition-all cursor-pointer"
                title="Save Layout to Profile"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Alert Banners */}
          {errorMsg && (
            <div className="w-full p-3.5 bg-red-950/40 border border-red-500/50 text-red-200 text-xs font-bold rounded-xl flex items-center justify-between animate-fade-in">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white text-xs font-mono ml-3 cursor-pointer">DISMISS</button>
            </div>
          )}
          {successMsg && (
            <div className="w-full p-3.5 bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 text-xs font-bold rounded-xl flex items-center justify-between animate-fade-in">
              <span>{successMsg}</span>
              <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white text-xs font-mono ml-3 cursor-pointer">DISMISS</button>
            </div>
          )}

          {/* Active Canvas Context Toolbar (When an object is selected) */}
          {activeObject && (
            <div className="w-full flex items-center justify-between p-2.5 bg-[#101A33] border border-[#00E5FF]/40 rounded-xl shadow-[0_0_15px_rgba(0,229,255,0.15)] animate-fade-in">
              <span className="text-[10px] text-[#00E5FF] font-black uppercase tracking-widest pl-2">
                SELECTED: {activeObject.type === 'i-text' ? 'TYPOGRAPHY' : 'CUSTOM ARTWORK'}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => changeLayer('forward')}
                  className="p-1.5 hover:bg-[#050816] rounded-lg text-[#91A4C7] hover:text-white transition-colors cursor-pointer"
                  title="Bring Forward"
                >
                  <Layers className="w-3.5 h-3.5 rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={() => changeLayer('backward')}
                  className="p-1.5 hover:bg-[#050816] rounded-lg text-[#91A4C7] hover:text-white transition-colors cursor-pointer"
                  title="Send Backward"
                >
                  <Layers className="w-3.5 h-3.5" />
                </button>
                <div className="w-[1px] h-3.5 bg-[#287BFF]/30 mx-1"></div>
                <button
                  type="button"
                  onClick={() => {
                    fabricCanvas.remove(activeObject);
                    fabricCanvas.discardActiveObject();
                    fabricCanvas.renderAll();
                    setSuccessMsg("Object removed from canvas.");
                  }}
                  className="p-1.5 hover:bg-red-950/50 rounded-lg text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                  title="Delete Object"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* THE MAIN POSTER CANVAS STAGE */}
          <div className={`relative w-full flex items-center justify-center p-6 sm:p-10 rounded-2xl overflow-hidden transition-all duration-500 ${
            viewMode === 'gallery'
              ? 'bg-gradient-to-b from-[#141d33] to-[#0a1020] border-2 border-[#287BFF]/30 min-h-[560px]'
              : 'bg-[#050816] border border-[#287BFF]/20 min-h-[540px]'
          }`}>
            {/* Gallery Atmospheric Lighting & Wall Accent */}
            {viewMode === 'gallery' && (
              <>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-[#00E5FF]/10 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-4 left-6 text-[10px] font-mono text-[#91A4C7]/60 uppercase tracking-widest pointer-events-none">
                  GALLERY VIEW // ARCHITECTURAL STUDIO WALL
                </div>
              </>
            )}

            {/* Poster Physical Presentation Frame */}
            <div className={`relative transition-all duration-500 ${
              frameName === 'Obsidian Frame'
                ? 'p-4 bg-[#111116] border-4 border-[#22222b] shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-sm'
                : frameName === 'Chrome Frame'
                ? 'p-3 bg-[#cbd5e1] border-2 border-white shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-sm'
                : 'cyber-canvas-glow rounded-lg'
            }`}>
              {/* Actual Canvas */}
              <canvas ref={canvasRef} className="rounded-md overflow-hidden block shadow-2xl" />

              {/* Archival Matte Paper Sheen */}
              <div className="absolute inset-0 pointer-events-none mix-blend-overlay bg-white/[0.04] rounded-md"></div>
            </div>
          </div>

          {/* Technical Specs Footer of Canvas Stage */}
          <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-[#91A4C7] pt-2 border-t border-[#287BFF]/15">
            <div className="flex items-center gap-3">
              <span className="text-white font-bold">{sizeName} ({activeSize.dimensions})</span>
              <span>•</span>
              <span className="text-[#00E5FF]">{orientation}</span>
              <span>•</span>
              <span>{paperType} Paper</span>
            </div>
            <div className="text-[#00E5FF] font-bold">
              300 DPI // CMYK COLOR CALIBRATED
            </div>
          </div>

        </div>

        {/* ===================================================================== */}
        {/* RIGHT COLUMN: THE 4-STEP CONFIGURATION STUDIO CONTROL PANEL */}
        {/* ===================================================================== */}
        <div className="w-full lg:w-[420px] shrink-0 flex flex-col bg-[#0A1024]/90 border border-[#287BFF]/25 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
          
          {/* Studio Navigation Tabs */}
          <div className="grid grid-cols-5 border-b border-[#287BFF]/20 bg-[#050816]/70 text-center">
            {[
              { id: 'presets', icon: ImageIcon, label: 'Artwork' },
              { id: 'upload', icon: Upload, label: 'Upload' },
              { id: 'size', icon: Settings, label: 'Size' },
              { id: 'text', icon: Type, label: 'Text' },
              { id: 'saved', icon: Save, label: 'Saved' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3.5 flex flex-col items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                    isActive
                      ? 'border-[#00E5FF] text-[#00E5FF] bg-[#287BFF]/10 shadow-[inset_0_-2px_10px_rgba(0,229,255,0.2)]'
                      : 'border-transparent text-[#91A4C7] hover:text-white hover:bg-[#101A33]/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Body */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[580px]">

            {/* ================================================================= */}
            {/* STEP 01 — CHOOSE YOUR ARTWORK (CURATED PRESETS) */}
            {/* ================================================================= */}
            {activeTab === 'presets' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-[#00E5FF] uppercase font-bold tracking-widest">
                    STAGE 01 // ARTWORK CURATION
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Select a Curated Masterpiece
                  </h3>
                  <p className="text-xs text-[#91A4C7] leading-relaxed">
                    Click any design to instantly project it onto the studio canvas. You can overlay typography, rotate, and crop.
                  </p>
                </div>

                {/* Presets Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {CURATED_PRESETS.map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleLoadPreset(preset)}
                        className={`group relative rounded-xl overflow-hidden border p-2 cursor-pointer transition-all duration-300 ${
                          isSelected
                            ? 'border-[#00E5FF] bg-[#287BFF]/15 shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                            : 'border-[#287BFF]/20 bg-[#101A33]/50 hover:border-[#287BFF]/60 hover:bg-[#101A33]'
                        }`}
                      >
                        <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden mb-2 bg-[#050816]">
                          <Image
                            src={preset.url}
                            alt={preset.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="180px"
                          />
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#00E5FF] text-[#050816] flex items-center justify-center font-bold">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-[10px] font-black text-white truncate uppercase tracking-wider">{preset.title}</div>
                          <div className="text-[9px] font-mono text-[#00E5FF] font-bold">{preset.category}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* STEP 02 — UPLOAD YOUR OWN DESIGN */}
            {/* ================================================================= */}
            {activeTab === 'upload' && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-[#00E5FF] uppercase font-bold tracking-widest">
                    STAGE 02 // PERSONAL ARCHIVE
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Upload Your Custom Artwork
                  </h3>
                  <p className="text-xs text-[#91A4C7] leading-relaxed">
                    Upload high-res photos, digital art, or wallpapers. Supports PNG, JPG, or WEBP up to 15MB.
                  </p>
                </div>

                {/* Drag and Drop Upload Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer group ${
                    isDragOver
                      ? 'border-[#00E5FF] bg-[#00E5FF]/10 shadow-[0_0_20px_rgba(0,229,255,0.3)]'
                      : 'border-[#287BFF]/30 hover:border-[#00E5FF] bg-[#101A33]/40'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  
                  <div className="space-y-3">
                    {isUploading ? (
                      <Loader2 className="w-10 h-10 text-[#00E5FF] animate-spin mx-auto" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#287BFF]/15 border border-[#287BFF]/30 flex items-center justify-center mx-auto text-[#00E5FF] group-hover:scale-110 transition-transform">
                        <Upload className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-white">
                        {isUploading ? 'Uploading & Optimizing...' : 'Drag & Drop Artwork Here'}
                      </p>
                      <p className="text-[10px] text-[#91A4C7] mt-1 font-mono">
                        Or click to browse your computer
                      </p>
                    </div>
                    <div className="inline-block px-3 py-1 rounded-full bg-[#050816] border border-[#287BFF]/20 text-[9px] font-mono text-[#00E5FF]">
                      PNG • JPG • WEBP (MAX 15MB)
                    </div>
                  </div>

                  {/* Upload Progress Bar */}
                  {uploadProgress > 0 && (
                    <div className="w-full bg-[#050816] rounded-full h-1.5 mt-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#287BFF] to-[#00E5FF] h-1.5 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                {/* Fine Image Controls when Image is Active on Canvas */}
                {activeObject && (activeObject.type === 'image' || activeObject.type === 'image-element') && (
                  <div className="p-4 bg-[#101A33] border border-[#287BFF]/30 rounded-2xl space-y-4">
                    <div className="text-[10px] font-mono text-[#00E5FF] font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-[#287BFF]/20 pb-2">
                      <Settings className="w-3.5 h-3.5" />
                      Artwork Transform &amp; Crop
                    </div>

                    {/* Quick Rotation */}
                    <div className="space-y-2">
                      <label className="text-[10px] text-[#91A4C7] font-bold uppercase tracking-wider block">Rotation</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleRotateActive(-90)}
                          className="flex-1 py-2 bg-[#050816] border border-[#287BFF]/20 hover:border-[#00E5FF] rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
                        >
                          -90°
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRotateActive(90)}
                          className="flex-1 py-2 bg-[#050816] border border-[#287BFF]/20 hover:border-[#00E5FF] rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
                        >
                          +90°
                        </button>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={Math.round(activeObject.angle || 0)}
                        onChange={(e) => {
                          activeObject.set('angle', parseInt(e.target.value));
                          activeObject.setCoords();
                          fabricCanvas.renderAll();
                          fabricCanvas.fire('object:modified', { target: activeObject });
                          triggerReactUpdate();
                        }}
                        className="w-full accent-[#00E5FF] bg-[#050816] h-1.5 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Non-destructive Cropping Sliders */}
                    <div className="space-y-3 pt-2 border-t border-[#287BFF]/20">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-[#91A4C7] font-bold uppercase tracking-wider">Crop Boundaries</label>
                        <button
                          type="button"
                          onClick={() => {
                            activeObject.set({
                              cropX: 0,
                              cropY: 0,
                              width: activeObject.get('originalWidth') || activeObject.width,
                              height: activeObject.get('originalHeight') || activeObject.height,
                            });
                            activeObject.setCoords();
                            fabricCanvas.renderAll();
                            fabricCanvas.fire('object:modified', { target: activeObject });
                            triggerReactUpdate();
                          }}
                          className="text-[9px] text-[#00E5FF] hover:underline uppercase font-mono font-bold cursor-pointer"
                        >
                          Reset Crop
                        </button>
                      </div>

                      {/* Left & Right Crop */}
                      <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-[#91A4C7]">
                        <div>
                          <span>Crop Left</span>
                          <input
                            type="range"
                            min="0"
                            max={Math.max(1, (activeObject.get('originalWidth') || activeObject.width) - 20)}
                            value={Math.round(activeObject.cropX || 0)}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              const origWidth = activeObject.get('originalWidth') || activeObject.width;
                              if (!activeObject.get('originalWidth')) activeObject.set('originalWidth', activeObject.width);
                              const cropRight = origWidth - (activeObject.cropX || 0) - activeObject.width;
                              const dX = val - (activeObject.cropX || 0);
                              activeObject.set({
                                cropX: val,
                                width: Math.max(10, origWidth - val - cropRight),
                                left: activeObject.left + dX * activeObject.scaleX
                              });
                              activeObject.setCoords();
                              fabricCanvas.renderAll();
                              fabricCanvas.fire('object:modified', { target: activeObject });
                              triggerReactUpdate();
                            }}
                            className="w-full accent-[#00E5FF] bg-[#050816] h-1 rounded cursor-pointer mt-1"
                          />
                        </div>
                        <div>
                          <span>Crop Top</span>
                          <input
                            type="range"
                            min="0"
                            max={Math.max(1, (activeObject.get('originalHeight') || activeObject.height) - 20)}
                            value={Math.round(activeObject.cropY || 0)}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              const origHeight = activeObject.get('originalHeight') || activeObject.height;
                              if (!activeObject.get('originalHeight')) activeObject.set('originalHeight', activeObject.height);
                              const cropBottom = origHeight - (activeObject.cropY || 0) - activeObject.height;
                              const dY = val - (activeObject.cropY || 0);
                              activeObject.set({
                                cropY: val,
                                height: Math.max(10, origHeight - val - cropBottom),
                                top: activeObject.top + dY * activeObject.scaleY
                              });
                              activeObject.setCoords();
                              fabricCanvas.renderAll();
                              fabricCanvas.fire('object:modified', { target: activeObject });
                              triggerReactUpdate();
                            }}
                            className="w-full accent-[#00E5FF] bg-[#050816] h-1 rounded cursor-pointer mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Opacity */}
                    <div className="space-y-1.5 pt-2 border-t border-[#287BFF]/20">
                      <div className="flex justify-between text-[10px] text-[#91A4C7] font-bold">
                        <span>Opacity</span>
                        <span className="font-mono text-white">{Math.round((activeObject.opacity || 1) * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={Math.round((activeObject.opacity || 1) * 100)}
                        onChange={(e) => {
                          activeObject.set('opacity', parseInt(e.target.value) / 100);
                          fabricCanvas.renderAll();
                          fabricCanvas.fire('object:modified', { target: activeObject });
                          triggerReactUpdate();
                        }}
                        className="w-full accent-[#00E5FF] bg-[#050816] h-1.5 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================================================================= */}
            {/* STEP 03 — SELECT POSTER SIZE & ORIENTATION */}
            {/* ================================================================= */}
            {activeTab === 'size' && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-[#00E5FF] uppercase font-bold tracking-widest">
                    STAGE 03 // PHYSICAL SPECIFICATIONS
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Select Dimensions &amp; Orientation
                  </h3>
                  <p className="text-xs text-[#91A4C7] leading-relaxed">
                    Choose standard ISO archival dimensions calibrated for crisp 300 DPI high-definition physical output.
                  </p>
                </div>

                {/* Orientation Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-[#91A4C7] uppercase font-bold tracking-wider">
                    Orientation
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(['PORTRAIT', 'LANDSCAPE'] as const).map((orient) => (
                      <button
                        key={orient}
                        type="button"
                        onClick={() => setOrientation(orient)}
                        className={`py-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                          orientation === orient
                            ? 'border-[#00E5FF] bg-[#287BFF]/20 text-white shadow-[0_0_15px_rgba(0,229,255,0.25)]'
                            : 'border-[#287BFF]/20 bg-[#101A33]/40 text-[#91A4C7] hover:border-[#287BFF]/50 hover:text-white'
                        }`}
                      >
                        {orient === 'PORTRAIT' ? 'Portrait (Vertical)' : 'Landscape (Horizontal)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Poster Size Cards */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-[#91A4C7] uppercase font-bold tracking-wider">
                    Poster Format &amp; Price
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {POSTER_SIZES.map((size) => {
                      const isSelected = sizeName === size.name;
                      return (
                        <button
                          key={size.name}
                          type="button"
                          onClick={() => setSizeName(size.name)}
                          className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-300 ${
                            isSelected
                              ? 'border-[#00E5FF] bg-[#287BFF]/20 text-white shadow-[0_0_15px_rgba(0,229,255,0.25)]'
                              : 'border-[#287BFF]/20 bg-[#101A33]/40 text-[#91A4C7] hover:border-[#287BFF]/50 hover:text-white'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-black text-white">{size.name}</span>
                            <span className="text-sm font-black text-[#00E5FF]">₹{size.price}</span>
                          </div>
                          <div className="text-[10px] font-mono text-[#91A4C7]">{size.dimensions}</div>
                          <div className="text-[9px] font-mono text-[#B9F4FF]/70 mt-1 uppercase">
                            {size.name === 'A3' ? 'Statement Wall Print' : size.name === 'A4' ? 'Standard Frame (Popular)' : size.name === 'A5' ? 'Desk Stand Art' : 'Mini Art Card'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Frame Style Preview Selection */}
                <div className="space-y-2 pt-2 border-t border-[#287BFF]/20">
                  <label className="text-[10px] font-mono text-[#91A4C7] uppercase font-bold tracking-wider">
                    Presentation Frame (Gallery Mockup)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { name: 'No Frame', label: 'Frameless' },
                      { name: 'Obsidian Frame', label: 'Obsidian Matte' },
                      { name: 'Chrome Frame', label: 'Chrome Edge' },
                    ].map((f) => (
                      <button
                        key={f.name}
                        type="button"
                        onClick={() => setFrameName(f.name)}
                        className={`p-2.5 rounded-xl border text-center text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          frameName === f.name
                            ? 'border-[#00E5FF] bg-[#287BFF]/20 text-white shadow-[0_0_12px_rgba(0,229,255,0.2)]'
                            : 'border-[#287BFF]/20 bg-[#101A33]/40 text-[#91A4C7] hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Physical Poster Size Reference Lightbox */}
                <div className="pt-2">
                  <PosterSizeReference compact showTitle={false} />
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* STEP 04 — TYPOGRAPHY OVERLAY */}
            {/* ================================================================= */}
            {activeTab === 'text' && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-[#00E5FF] uppercase font-bold tracking-widest">
                    STAGE 04 // TYPOGRAPHY
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Add Typography Overlay
                  </h3>
                  <p className="text-xs text-[#91A4C7] leading-relaxed">
                    Type a title, quote, or cybernetic subtitle to overlay onto your custom poster print.
                  </p>
                </div>

                {/* Text Input */}
                <div className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="ENTER TEXT OVERLAY"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="w-full px-4 py-3 bg-[#050816] border border-[#287BFF]/30 rounded-xl text-xs font-mono text-white placeholder-[#91A4C7]/50 focus:outline-none focus:border-[#00E5FF] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={addTextElement}
                    disabled={!textInput.trim()}
                    className="w-full py-3 bg-gradient-to-r from-[#287BFF] to-[#00E5FF] disabled:opacity-40 text-[#050816] font-black text-xs uppercase tracking-widest rounded-xl transition-all hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] cursor-pointer disabled:cursor-not-allowed"
                  >
                    Add Text to Poster
                  </button>
                </div>

                {/* Selected Text Options */}
                {activeObject && activeObject.type === 'i-text' && (
                  <div className="p-4 bg-[#101A33] border border-[#287BFF]/30 rounded-2xl space-y-4">
                    <div className="text-[10px] font-mono text-[#00E5FF] font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-[#287BFF]/20 pb-2">
                      <Type className="w-3.5 h-3.5" />
                      Text Styling
                    </div>

                    {/* Text content edit */}
                    <textarea
                      value={activeObject.text || ''}
                      onChange={(e) => updateActiveText('text', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-[#050816] border border-[#287BFF]/30 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-[#00E5FF] resize-none"
                    />

                    {/* Font Family */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#91A4C7] font-bold uppercase">Font Family</label>
                      <select
                        value={activeObject.fontFamily}
                        onChange={(e) => updateActiveText('fontFamily', e.target.value)}
                        className="w-full bg-[#050816] border border-[#287BFF]/30 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#00E5FF] cursor-pointer"
                      >
                        {AVAILABLE_FONTS.map(f => (
                          <option key={f} value={f} className="bg-[#050816] text-white">{f}</option>
                        ))}
                      </select>
                    </div>

                    {/* Formatting Bold / Italic / Alignment */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={toggleBold}
                        className={`p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                          activeObject.fontWeight === 'bold'
                            ? 'border-[#00E5FF] bg-[#287BFF]/20 text-[#00E5FF]'
                            : 'border-[#287BFF]/20 text-[#91A4C7] hover:text-white'
                        }`}
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={toggleItalic}
                        className={`p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                          activeObject.fontStyle === 'italic'
                            ? 'border-[#00E5FF] bg-[#287BFF]/20 text-[#00E5FF]'
                            : 'border-[#287BFF]/20 text-[#91A4C7] hover:text-white'
                        }`}
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-[1px] h-6 bg-[#287BFF]/20 my-auto"></div>
                      <button
                        type="button"
                        onClick={() => updateActiveText('textAlign', 'left')}
                        className={`p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                          activeObject.textAlign === 'left'
                            ? 'border-[#00E5FF] bg-[#287BFF]/20 text-[#00E5FF]'
                            : 'border-[#287BFF]/20 text-[#91A4C7] hover:text-white'
                        }`}
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateActiveText('textAlign', 'center')}
                        className={`p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                          activeObject.textAlign === 'center'
                            ? 'border-[#00E5FF] bg-[#287BFF]/20 text-[#00E5FF]'
                            : 'border-[#287BFF]/20 text-[#91A4C7] hover:text-white'
                        }`}
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateActiveText('textAlign', 'right')}
                        className={`p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                          activeObject.textAlign === 'right'
                            ? 'border-[#00E5FF] bg-[#287BFF]/20 text-[#00E5FF]'
                            : 'border-[#287BFF]/20 text-[#91A4C7] hover:text-white'
                        }`}
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Font Size */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-[#91A4C7]">
                        <span>Font Size</span>
                        <span className="font-mono text-white">{activeObject.fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="80"
                        value={activeObject.fontSize}
                        onChange={(e) => updateActiveText('fontSize', parseInt(e.target.value))}
                        className="w-full accent-[#00E5FF] bg-[#050816] h-1.5 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Color Swatches */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[#91A4C7] font-bold block">Color</label>
                      <div className="flex gap-2">
                        {['#00E5FF', '#287BFF', '#B9F4FF', '#ffffff', '#000000', '#fcd34d', '#ec4899'].map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => updateActiveText('fill', c)}
                            className={`w-6 h-6 rounded-full border cursor-pointer transition-all hover:scale-110 ${
                              activeObject.fill === c ? 'border-white ring-2 ring-[#00E5FF]' : 'border-[#287BFF]/30'
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================================================================= */}
            {/* STEP 05 — SAVED DESIGNS (MY DESIGNS LIBRARY) */}
            {/* ================================================================= */}
            {activeTab === 'saved' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-[#00E5FF] uppercase font-bold tracking-widest">
                    STAGE 05 // SAVED LAYOUTS
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    My Saved Profile Designs
                  </h3>
                  <p className="text-xs text-[#91A4C7] leading-relaxed">
                    Retrieve or delete poster layouts saved in your profile library.
                  </p>
                </div>

                {isDesignsLoading ? (
                  <div className="text-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-[#00E5FF] mx-auto" />
                  </div>
                ) : savedDesigns.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {savedDesigns.map((design) => (
                      <div
                        key={design.id}
                        onClick={() => loadSavedConfig(design)}
                        className="bg-[#101A33] border border-[#287BFF]/25 hover:border-[#00E5FF] p-2.5 rounded-xl cursor-pointer transition-all group relative flex flex-col justify-between"
                      >
                        <div className="relative aspect-[3/4] w-full bg-[#050816] rounded-lg overflow-hidden mb-2">
                          <Image
                            src={design.previewImage}
                            alt={design.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="140px"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-[10px] font-black text-white truncate uppercase">{design.name}</div>
                          <div className="text-[8px] font-mono text-[#91A4C7]">
                            {new Date(design.updatedAt).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={(e) => deleteSavedConfig(e, design.id)}
                          className="absolute top-2 right-2 p-1 bg-black/80 hover:bg-red-950 border border-neutral-700 rounded-md text-neutral-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-[#050816]/60 border border-[#287BFF]/15 rounded-2xl space-y-2">
                    <Save className="w-8 h-8 text-[#91A4C7]/40 mx-auto" />
                    <p className="text-xs text-[#91A4C7] font-bold">No saved designs yet.</p>
                    <p className="text-[10px] text-[#91A4C7]/60">Click the disk icon in the toolbar to save your layout.</p>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* ================================================================= */}
          {/* CONTROL PANEL FOOTER: ORDER SUMMARY & ADD TO CART ACTION */}
          {/* ================================================================= */}
          <div className="bg-[#050816] p-6 border-t border-[#287BFF]/20 space-y-4">
            
            {/* Blueprint Summary Details */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-[#91A4C7]">
                <span>Poster Format</span>
                <span className="text-white font-bold">{sizeName} ({activeSize.dimensions})</span>
              </div>
              <div className="flex justify-between text-[#91A4C7]">
                <span>Orientation</span>
                <span className="text-white font-bold">{orientation}</span>
              </div>
              <div className="flex justify-between text-[#91A4C7]">
                <span>Unit Price</span>
                <span className="text-[#00E5FF] font-bold">₹{priceBreakdown.unitPrice}</span>
              </div>
            </div>

            {/* Quantity Selector & Final Subtotal */}
            <div className="flex items-center justify-between border-t border-[#287BFF]/20 pt-3">
              <div className="flex items-center bg-[#101A33] border border-[#287BFF]/30 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-1.5 text-[#91A4C7] hover:text-white transition-colors cursor-pointer font-bold text-sm"
                >
                  -
                </button>
                <span className="px-3 py-1 font-mono text-xs font-black text-white min-w-[32px] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3 py-1.5 text-[#91A4C7] hover:text-white transition-colors cursor-pointer font-bold text-sm"
                >
                  +
                </button>
              </div>

              <div className="text-right">
                <div className="text-[10px] font-mono text-[#91A4C7] uppercase">Subtotal</div>
                <div className="text-2xl font-black text-white leading-none">₹{priceBreakdown.total}</div>
              </div>
            </div>

            {/* Primary Order Action Button */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAddingToCart || isUploading}
              className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all duration-300 flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#287BFF] to-[#00E5FF] text-[#050816] shadow-[0_0_25px_rgba(0,229,255,0.35)] hover:shadow-[0_0_35px_rgba(0,229,255,0.6)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isAddingToCart ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#050816]" />
                  <span>Processing Studio Render...</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>{cartItemId ? 'Update Customizations' : 'Add Custom Print to Cart'}</span>
                </>
              )}
            </button>

          </div>
        </div>

      </main>

      {/* ========================================================================= */}
      {/* 3.D FLONATING PURCHASE BAR (STICKY BOTTOM ON SCROLL / MOBILE) */}
      {/* ========================================================================= */}
      {showFloatingBar && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-[#0A1024]/95 border-t border-[#287BFF]/40 backdrop-blur-xl p-3 sm:p-4 animate-fade-in shadow-2xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-12 rounded-lg bg-[#050816] border border-[#287BFF]/30 flex items-center justify-center text-[#00E5FF] shrink-0 overflow-hidden relative">
                <ImageIcon className="w-5 h-5 opacity-60" />
              </div>
              <div>
                <div className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                  <span>Custom Poster Print</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#287BFF]/20 text-[#00E5FF] text-[9px] font-mono font-bold">
                    {sizeName}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-[#91A4C7]">
                  {orientation} • Qty: {quantity}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[9px] font-mono text-[#91A4C7] uppercase">Total</div>
                <div className="text-lg font-black text-white">₹{priceBreakdown.total}</div>
              </div>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isAddingToCart || isUploading}
                className="px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[11px] bg-gradient-to-r from-[#287BFF] to-[#00E5FF] text-[#050816] hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{isAddingToCart ? 'Rendering...' : 'Add to Cart'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SAVE DESIGN DIALOG MODAL */}
      {/* ========================================================================= */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0A1024] border border-[#287BFF]/40 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="text-sm font-black uppercase tracking-wider text-white border-b border-[#287BFF]/20 pb-3 flex items-center gap-2">
              <Save className="w-4 h-4 text-[#00E5FF]" />
              Save Layout Configuration
            </h3>
            <p className="text-xs text-[#91A4C7] leading-relaxed">
              Name this layout to easily reload it anytime from your studio profile library.
            </p>
            
            <input
              type="text"
              placeholder="e.g. Cyberpunk Neon Grid"
              value={saveDesignName}
              onChange={(e) => setSaveDesignName(e.target.value)}
              className="w-full px-4 py-3 bg-[#050816] border border-[#287BFF]/30 rounded-xl text-xs font-semibold text-white placeholder-[#91A4C7]/50 focus:outline-none focus:border-[#00E5FF] transition-colors"
            />

            <div className="flex gap-2.5 justify-end pt-2 text-xs font-black uppercase tracking-wider">
              <button
                type="button"
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveDesignName('');
                }}
                className="px-4 py-2 border border-[#287BFF]/20 rounded-xl text-[#91A4C7] hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDesign}
                disabled={isSavingDesign || !saveDesignName.trim()}
                className="px-5 py-2 bg-gradient-to-r from-[#287BFF] to-[#00E5FF] text-[#050816] disabled:opacity-40 rounded-xl font-bold transition-all cursor-pointer"
              >
                {isSavingDesign ? 'Saving...' : 'Save Design'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Footer */}
      <Footer />
    </div>
  );
}

export default function CustomPosterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050816] text-[#00E5FF] flex flex-col items-center justify-center font-mono font-bold uppercase tracking-widest text-xs gap-3">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span>BOOTING CYBERPUNK STUDIO CORE...</span>
      </div>
    }>
      <ConfiguratorContent />
    </Suspense>
  );
}
