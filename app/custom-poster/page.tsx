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
  Upload, ShoppingBag, ArrowLeft, Flame, Info, Type, Settings, Crop,
  Undo2, Redo2, RotateCcw, Save, Trash2, Layers, Grid, Sparkles, Check, Loader2, Bold, Italic, AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';
import Image from 'next/image';
import ScrollReveal from '@/components/ScrollReveal';
import { 
  POSTER_SIZES, PAPER_TYPES, FRAME_FINISHES, 
  calculateCustomPosterPrice 
} from '@/lib/customPosterPricing';

// Custom fonts loaded dynamically
const AVAILABLE_FONTS = ['Outfit', 'Cinzel', 'Anton', 'Montserrat', 'Special Elite'];

const STARTER_TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank Slate',
    description: 'Start from scratch',
    backgroundColor: '#080808',
    objects: []
  },
  {
    id: 'minimal',
    name: 'Minimalist Art',
    description: 'Elegant serif layout',
    backgroundColor: '#ffffff',
    objects: [
      {
        type: 'IText',
        text: 'THE BALANCE',
        left: 80,
        top: 380,
        fontFamily: 'Cinzel',
        fontSize: 32,
        fill: '#111111',
        fontWeight: 'bold',
        charSpacing: 100,
        textAlign: 'center'
      },
      {
        type: 'IText',
        text: 'Exploring form, light, and negative space',
        left: 80,
        top: 430,
        fontFamily: 'Outfit',
        fontSize: 10,
        fill: '#777777',
        charSpacing: 20
      }
    ]
  },
  {
    id: 'movie',
    name: 'Cinema Classic',
    description: 'Classic movie credit details',
    backgroundColor: '#0a0a0a',
    objects: [
      {
        type: 'IText',
        text: 'A HELLFIRE FILMS PRESENTATION',
        left: 60,
        top: 50,
        fontFamily: 'Outfit',
        fontSize: 8,
        fill: '#C1121F',
        fontWeight: 'bold',
        charSpacing: 150
      },
      {
        type: 'IText',
        text: 'DARK SILENCE',
        left: 60,
        top: 80,
        fontFamily: 'Anton',
        fontSize: 40,
        fill: '#ffffff',
        charSpacing: 50
      },
      {
        type: 'IText',
        text: 'DIRECTED BY THE HACKATHON TEAM  •  STARRING AGENT ANTIGRAVITY\nPRODUCED IN ASSOCIATION WITH GOOGLE DEEPMIND  •  ALL RIGHTS RESERVED',
        left: 50,
        top: 440,
        fontFamily: 'Outfit',
        fontSize: 7,
        fill: '#888888',
        textAlign: 'center',
        charSpacing: 40
      }
    ]
  },
  {
    id: 'motivational',
    name: 'Bold Quote',
    description: 'High contrast text focus',
    backgroundColor: '#C1121F',
    objects: [
      {
        type: 'IText',
        text: 'DEVIATE',
        left: 50,
        top: 180,
        fontFamily: 'Anton',
        fontSize: 54,
        fill: '#ffffff',
        textAlign: 'center'
      },
      {
        type: 'IText',
        text: 'THE COMFORT ZONE IS THE GRAVEYARD OF PROGRESS.',
        left: 60,
        top: 260,
        fontFamily: 'Montserrat',
        fontSize: 11,
        fill: '#000000',
        fontWeight: 'bold',
        textAlign: 'center',
        charSpacing: 50
      }
    ]
  },
  {
    id: 'cyberpunk',
    name: 'Futuristic Cyber',
    description: 'Glowing dark aesthetic',
    backgroundColor: '#080508',
    objects: [
      {
        type: 'IText',
        text: 'SYSTEM_ERROR_404',
        left: 50,
        top: 80,
        fontFamily: 'Special Elite',
        fontSize: 24,
        fill: '#00ffff',
        fontWeight: 'bold'
      },
      {
        type: 'IText',
        text: 'HELLFIRE OPERATING SYSTEM // RETRO_FUTURE_ONLINE',
        left: 50,
        top: 420,
        fontFamily: 'Outfit',
        fontSize: 9,
        fill: '#ff00ff',
        charSpacing: 80
      }
    ]
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
  const [orientation, setOrientation] = useState<'PORTRAIT' | 'LANDSCAPE' | 'SQUARE'>('PORTRAIT');
  const [quantity, setQuantity] = useState<number>(1);

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

  // Premium visual control selection styling
  const setCustomControls = (obj: any) => {
    if (!obj) return;
    obj.set({
      borderColor: '#C1121F',
      cornerColor: '#FF4D4D',
      cornerStrokeColor: '#C1121F',
      cornerSize: 10,
      cornerStyle: 'circle',
      transparentCorners: false,
      padding: 4,
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
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Text inputs
  const [textInput, setTextInput] = useState('');

  // Tab configurations
  const [activeTab, setActiveTab] = useState<'templates' | 'upload' | 'text' | 'styling' | 'saved'>('templates');

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
        width: 350,
        height: 480,
        backgroundColor: '#080808',
        preserveObjectStacking: true,
      });
      fabricCanvasRef.current = canvas;

      // Apply initial clipping box
      const clipRect = new f.Rect({
        left: 0,
        top: 0,
        width: 350,
        height: 480,
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
    if (!fabricCanvas) return;

    const size = POSTER_SIZES.find(s => s.name === sizeName);
    let aspectRatio = size ? size.aspectRatio : 21 / 29.7; // default A4

    let canvasWidth = 350;
    let canvasHeight = 480;

    if (orientation === 'PORTRAIT') {
      canvasHeight = Math.round(canvasWidth / aspectRatio);
    } else if (orientation === 'LANDSCAPE') {
      canvasHeight = Math.round(canvasWidth * aspectRatio);
    } else {
      // SQUARE
      canvasHeight = canvasWidth;
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

  // Pricing calculations
  const priceBreakdown = useMemo(() => {
    const unitPrice = calculateCustomPosterPrice({ sizeName, paperType, frameName });
    return {
      unitPrice,
      total: unitPrice * quantity
    };
  }, [sizeName, paperType, frameName, quantity]);

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
    if (!fabricCanvas || !textInput.trim()) return;
    
    const f = fabricModule.fabric;
    const textObj = new f.IText(textInput, {
      left: 60,
      top: 150,
      fontSize: 24,
      fontFamily: 'Outfit',
      fill: '#ffffff',
    });

    setCustomControls(textObj);
    fabricCanvas.add(textObj);
    fabricCanvas.setActiveObject(textObj);
    fabricCanvas.renderAll();
    setTextInput('');
  };

  // Change active text configurations
  const updateActiveText = (key: string, value: any) => {
    if (!activeObject) return;
    activeObject.set(key, value);
    fabricCanvas.renderAll();
    // Trigger history update manually for modifications
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

  // Upload artwork image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvas) return;

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg("File size exceeds the 15MB limit.");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    const f = fabricModule.fabric;

    setIsUploading(true);
    setErrorMsg(null);

    // Instant preview local blob
    f.Image.fromURL(localUrl, (img: any) => {
      // scale image to fit nicely on the canvas initially
      const canvasWidth = fabricCanvas.getWidth();
      const scale = (canvasWidth * 0.7) / img.width;
      img.scale(scale);
      img.set({
        left: canvasWidth * 0.15,
        top: 80,
      });
      img.set('blobUrl', localUrl);
      setCustomControls(img);
      fabricCanvas.add(img);
      fabricCanvas.setActiveObject(img);
      fabricCanvas.renderAll();
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
            // Force history state push
            fabricCanvas.fire('object:modified', { target: addedImg });
          }, { crossOrigin: 'anonymous' });
        }
        setSuccessMsg("Artwork uploaded and stabilized successfully.");
      } else {
        setErrorMsg(data.error || "Failed to upload image permanently.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Connection failure during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  // Starters / Templates loader
  const handleLoadTemplate = (template: typeof STARTER_TEMPLATES[0]) => {
    if (!fabricCanvas) return;

    if (fabricCanvas.getObjects().length > 0) {
      if (!window.confirm("Loading this template will clear your current customizations. Proceed?")) {
        return;
      }
    }

    isStateChanging.current = true;
    fabricCanvas.clear();
    
    // Set background color
    fabricCanvas.setBackgroundColor(template.backgroundColor, () => {
      // Re-apply clipping box
      const clipRect = new fabricModule.fabric.Rect({
        left: 0,
        top: 0,
        width: fabricCanvas.getWidth(),
        height: fabricCanvas.getHeight(),
        absolutePositioned: true
      });
      fabricCanvas.clipPath = clipRect;

      const addPromises = template.objects.map((objData: any) => {
        return new Promise<void>((resolve) => {
          const text = new fabricModule.fabric.IText(objData.text, {
            left: objData.left,
            top: objData.top,
            fontFamily: objData.fontFamily,
            fontSize: objData.fontSize,
            fill: objData.fill,
            fontWeight: objData.fontWeight,
            charSpacing: objData.charSpacing || 0,
            textAlign: objData.textAlign || 'left',
          });
          setCustomControls(text);
          fabricCanvas.add(text);
          resolve();
        });
      });

      Promise.all(addPromises).then(() => {
        fabricCanvas.renderAll();
        isStateChanging.current = false;
        
        // Force history update
        const state = JSON.stringify(fabricCanvas.toJSON());
        history.current = [state];
        historyIndex.current = 0;
        setCanUndo(false);
        setCanRedo(false);
        setHasUnsavedChanges(true);
      });
    });
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
    if (!fabricCanvas) return;
    if (window.confirm("Are you sure you want to reset your design? All progress will be lost.")) {
      isStateChanging.current = true;
      fabricCanvas.clear();
      fabricCanvas.setBackgroundColor('#080808', () => {
        // Re-apply clipping box
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
      quality: 0.85
    });

    const resBlob = await fetch(base64Data);
    const blob = await resBlob.blob();
    const file = new File([blob], 'thumbnail.png', { type: 'image/png' });
    
    const formData = new FormData();
    formData.append('file', file);
    
    const uploadRes = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    const data = await uploadRes.json();
    if (!uploadRes.ok || !data.success) {
      throw new Error(data.error || "Failed to upload canvas preview.");
    }
    return data.url;
  };

  // Save design action
  const handleSaveDesign = async () => {
    if (!saveDesignName.trim()) return;

    try {
      setIsSavingDesign(true);
      setErrorMsg(null);

      // Upload thumbnail preview
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
        setSuccessMsg("Design successfully saved in your profile!");
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
        setSuccessMsg(cartItemId ? "Customizations successfully updated!" : "Masterpiece added to cart!");
        setHasUnsavedChanges(false);
        await refreshCart();
        router.push('/cart');
      } else {
        setErrorMsg(data.error || "Could not add poster configuration to cart.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Network failure during checkout.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Load previously saved design
  const loadSavedConfig = (design: any) => {
    if (!fabricCanvas) return;
    if (window.confirm(`Load saved design "${design.name}"? This will clear current configurations.`)) {
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

  // Frame finish border styles class
  const frameBorderClass = useMemo(() => {
    if (frameName === 'Black') return 'border-[16px] border-neutral-900 shadow-2xl';
    if (frameName === 'White') return 'border-[16px] border-neutral-100 shadow-2xl';
    if (frameName === 'Wooden') return 'border-[16px] border-amber-800/80 shadow-2xl';
    return 'border-0 border-transparent';
  }, [frameName]);

  return (
    <div className="min-h-screen bg-transparent text-[#F5F5F5] flex flex-col font-sans selection:bg-[#C1121F] selection:text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Cinzel:wght@400;700&family=Montserrat:wght@400;700&family=Outfit:wght@400;700&family=Special+Elite&display=swap');
      `}</style>

      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8 items-stretch">
        
        {/* LEFT COLUMN: Controls Configurator Side Drawer */}
        <ScrollReveal fiery={false} className="w-full lg:w-96 shrink-0 flex flex-col">
          <div className="w-full h-full flex flex-col bg-[#0F0F0F] border border-neutral-900 rounded-3xl overflow-hidden shadow-xl shadow-black/40">
          {/* Tab Selection */}
          <div className="grid grid-cols-5 border-b border-neutral-900 text-center bg-neutral-950/80">
            {[
              { id: 'templates', icon: Grid, label: 'Starters' },
              { id: 'upload', icon: Upload, label: 'Artwork' },
              { id: 'text', icon: Type, label: 'Text' },
              { id: 'styling', icon: Settings, label: 'Finishes' },
              { id: 'saved', icon: Save, label: 'My Designs' }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4.5 flex flex-col items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 cursor-pointer active:scale-95 ${
                    activeTab === tab.id 
                      ? 'border-[#C1121F] text-white bg-[#C1121F]/10' 
                      : 'border-transparent text-neutral-500 hover:text-neutral-350 hover:bg-neutral-900/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab content panel */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[450px] lg:max-h-[500px]">
            {/* 1. Templates Tab */}
            {activeTab === 'templates' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs text-neutral-350 font-black uppercase tracking-widest">Select Starter Template</h4>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Click to populate the canvas. You can edit all elements.</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {STARTER_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      onClick={() => handleLoadTemplate(tmpl)}
                      className="p-4 bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 hover:border-[#C1121F]/60 text-left rounded-2xl transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-black text-white uppercase tracking-wider group-hover:text-[#FF4D4D] transition-colors">{tmpl.name}</div>
                        <div className="text-[9px] text-neutral-500 font-semibold mt-1">{tmpl.description}</div>
                      </div>
                      <Sparkles className="w-4 h-4 text-neutral-700 group-hover:text-[#C1121F] transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Upload Tab */}
            {activeTab === 'upload' && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h4 className="text-xs text-neutral-350 font-black uppercase tracking-widest">Upload Custom Artwork</h4>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Drag/drop or select images. PNG, JPG, or WEBP (Max 15MB).</p>
                </div>

                {/* Upload box */}
                <div className="flex items-center justify-center border-2 border-dashed border-neutral-900 hover:border-[#C1121F] rounded-2xl p-6 transition-all bg-neutral-950/40 relative cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <div className="text-center space-y-2">
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 text-[#C1121F] animate-spin mx-auto" />
                    ) : (
                      <Upload className="w-8 h-8 text-neutral-650 group-hover:text-white mx-auto transition-colors" />
                    )}
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-450">
                      {isUploading ? 'Uploading and cropping...' : 'Select image file'}
                    </p>
                    <p className="text-[9px] text-neutral-600 font-mono font-bold">PNG, JPG, WEBP (Max 15MB)</p>
                  </div>
                </div>

                <div className="p-4 bg-neutral-950 border border-neutral-900 rounded-xl flex gap-3">
                  <Info className="w-4.5 h-4.5 text-[#C1121F] shrink-0" />
                  <p className="text-[9px] text-neutral-550 leading-relaxed font-semibold">
                    Uploaded artwork remains constrained inside the boundary card. Use canvas selection handles to resize, crop-position, or rotate it.
                  </p>
                </div>

                {/* Selected Image Customization */}
                {activeObject && (activeObject.type === 'image' || activeObject.type === 'image-element') && (
                  <div className="p-4 bg-neutral-950 border border-neutral-900 rounded-2xl space-y-4 shadow-inner">
                    <h5 className="text-[9px] text-[#FF4D4D] font-black uppercase tracking-widest border-b border-neutral-900 pb-2 flex items-center gap-1.5">
                      <Settings className="w-3 h-3 text-[#C1121F]" />
                      Artwork Customization
                    </h5>

                    {/* Rotation control */}
                    <div className="space-y-2">
                      <label className="text-[9px] text-neutral-500 font-black uppercase tracking-wider block">Rotate Image</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRotateActive(90)}
                          className="flex-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 hover:border-neutral-750 text-white font-bold py-2 rounded-xl text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Rotate +90°
                        </button>
                        <button
                          onClick={() => handleRotateActive(-90)}
                          className="flex-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 hover:border-neutral-750 text-white font-bold py-2 rounded-xl text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Rotate -90°
                        </button>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[8px] text-neutral-500 font-bold uppercase">
                          <span>Free Rotation</span>
                          <span className="font-mono text-white">{(activeObject.angle || 0).toFixed(0)}°</span>
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
                          className="w-full accent-[#C1121F] bg-neutral-900 h-1.5 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Non-destructive Crop sliders */}
                    <div className="space-y-3 pt-2 border-t border-neutral-900">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] text-neutral-500 font-black uppercase tracking-wider block">Crop Artwork</label>
                        <button
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
                          className="text-[8px] text-[#C1121F] hover:text-white uppercase tracking-widest font-black font-semibold"
                        >
                          Reset Crop
                        </button>
                      </div>
                      
                      {/* Left Crop */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[8px] text-neutral-500 font-bold uppercase">
                          <span>Crop Left</span>
                          <span className="font-mono text-white">{Math.round(activeObject.cropX || 0)}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={Math.max(1, (activeObject.get('originalWidth') || activeObject.width) - 20)}
                          value={Math.round(activeObject.cropX || 0)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            const origWidth = activeObject.get('originalWidth') || activeObject.width;
                            if (!activeObject.get('originalWidth')) {
                              activeObject.set('originalWidth', activeObject.width);
                            }
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
                          className="w-full accent-[#C1121F] bg-neutral-900 h-1.5 rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Right Crop */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[8px] text-neutral-500 font-bold uppercase">
                          <span>Crop Right</span>
                          <span className="font-mono text-white">
                            {Math.round((activeObject.get('originalWidth') || activeObject.width) - (activeObject.cropX || 0) - activeObject.width)}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={Math.max(1, (activeObject.get('originalWidth') || activeObject.width) - (activeObject.cropX || 0) - 20)}
                          value={Math.round((activeObject.get('originalWidth') || activeObject.width) - (activeObject.cropX || 0) - activeObject.width)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            const origWidth = activeObject.get('originalWidth') || activeObject.width;
                            if (!activeObject.get('originalWidth')) {
                              activeObject.set('originalWidth', activeObject.width);
                            }
                            const cropLeft = activeObject.cropX || 0;
                            activeObject.set({
                              width: Math.max(10, origWidth - cropLeft - val)
                            });
                            activeObject.setCoords();
                            fabricCanvas.renderAll();
                            fabricCanvas.fire('object:modified', { target: activeObject });
                            triggerReactUpdate();
                          }}
                          className="w-full accent-[#C1121F] bg-neutral-900 h-1.5 rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Top Crop */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[8px] text-neutral-500 font-bold uppercase">
                          <span>Crop Top</span>
                          <span className="font-mono text-white">{Math.round(activeObject.cropY || 0)}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={Math.max(1, (activeObject.get('originalHeight') || activeObject.height) - 20)}
                          value={Math.round(activeObject.cropY || 0)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            const origHeight = activeObject.get('originalHeight') || activeObject.height;
                            if (!activeObject.get('originalHeight')) {
                              activeObject.set('originalHeight', activeObject.height);
                            }
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
                          className="w-full accent-[#C1121F] bg-neutral-900 h-1.5 rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Bottom Crop */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[8px] text-neutral-500 font-bold uppercase">
                          <span>Crop Bottom</span>
                          <span className="font-mono text-white">
                            {Math.round((activeObject.get('originalHeight') || activeObject.height) - (activeObject.cropY || 0) - activeObject.height)}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={Math.max(1, (activeObject.get('originalHeight') || activeObject.height) - (activeObject.cropY || 0) - 20)}
                          value={Math.round((activeObject.get('originalHeight') || activeObject.height) - (activeObject.cropY || 0) - activeObject.height)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            const origHeight = activeObject.get('originalHeight') || activeObject.height;
                            if (!activeObject.get('originalHeight')) {
                              activeObject.set('originalHeight', activeObject.height);
                            }
                            const cropTop = activeObject.cropY || 0;
                            activeObject.set({
                              height: Math.max(10, origHeight - cropTop - val)
                            });
                            activeObject.setCoords();
                            fabricCanvas.renderAll();
                            fabricCanvas.fire('object:modified', { target: activeObject });
                            triggerReactUpdate();
                          }}
                          className="w-full accent-[#C1121F] bg-neutral-900 h-1.5 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Opacity slider */}
                    <div className="space-y-1.5 pt-2 border-t border-neutral-900">
                      <div className="flex justify-between items-center text-[9px] text-neutral-500 font-extrabold uppercase">
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
                        className="w-full accent-[#C1121F] bg-neutral-900 h-1.5 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. Text Tab */}
            {activeTab === 'text' && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h4 className="text-xs text-neutral-350 font-black uppercase tracking-widest">Add Typography Elements</h4>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Type text overlay, choose fonts and formatting.</p>
                </div>

                {/* Add new Text overlay input */}
                <div className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="ENTER TEXT OVERLAY"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="w-full px-4 py-3.5 bg-neutral-950 border border-neutral-900 rounded-xl text-xs uppercase font-mono text-white placeholder-neutral-700 focus:outline-none focus:border-[#C1121F] transition-colors"
                  />
                  <button
                    onClick={addTextElement}
                    disabled={!textInput.trim()}
                    className="w-full bg-[#C1121F] hover:bg-[#A00F19] disabled:bg-neutral-950 border border-transparent disabled:border-neutral-900 text-white disabled:text-neutral-600 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    Add Text to Poster
                  </button>
                </div>

                {/* Selected object properties customization */}
                {/* Selected object properties customization */}
                {activeObject && activeObject.type === 'i-text' && (
                  <div className="p-4 bg-neutral-950 border border-neutral-900 rounded-2xl space-y-4 shadow-inner">
                    <h5 className="text-[9px] text-[#FF4D4D] font-black uppercase tracking-widest border-b border-neutral-900 pb-2 flex items-center gap-1.5">
                      <Type className="w-3 h-3 text-[#C1121F]" />
                      Text Customization
                    </h5>

                    {/* Text Content Input */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-neutral-500 font-black uppercase tracking-wider">Text Content</label>
                      <textarea
                        value={activeObject.text || ''}
                        onChange={(e) => updateActiveText('text', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-850 rounded-xl text-xs font-semibold text-white placeholder-neutral-750 focus:outline-none focus:border-[#C1121F] resize-none"
                      />
                    </div>
                    
                    {/* Font Family selection */}
                    <div className="space-y-1.5 border-t border-neutral-900 pt-3">
                      <label className="text-[9px] text-neutral-500 font-black uppercase tracking-wider">Font Family</label>
                      <select
                        value={activeObject.fontFamily}
                        onChange={(e) => updateActiveText('fontFamily', e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-850 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-[#C1121F] appearance-none cursor-pointer"
                      >
                        {AVAILABLE_FONTS.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>

                    {/* Font formatting bold / italic / alignment */}
                    <div className="flex gap-2">
                      <button
                        onClick={toggleBold}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          activeObject.fontWeight === 'bold' ? 'border-[#C1121F] bg-[#C1121F]/10 text-white shadow' : 'border-neutral-900 text-neutral-450 hover:text-white hover:border-neutral-700'
                        }`}
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={toggleItalic}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          activeObject.fontStyle === 'italic' ? 'border-[#C1121F] bg-[#C1121F]/10 text-white shadow' : 'border-neutral-900 text-neutral-450 hover:text-white hover:border-neutral-700'
                        }`}
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <div className="border-l border-neutral-900 my-1 mx-1"></div>
                      <button
                        onClick={() => updateActiveText('textAlign', 'left')}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          activeObject.textAlign === 'left' ? 'border-[#C1121F] bg-[#C1121F]/10 text-white shadow' : 'border-neutral-900 text-neutral-450 hover:text-white hover:border-neutral-700'
                        }`}
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => updateActiveText('textAlign', 'center')}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          activeObject.textAlign === 'center' ? 'border-[#C1121F] bg-[#C1121F]/10 text-white shadow' : 'border-neutral-900 text-neutral-450 hover:text-white hover:border-neutral-700'
                        }`}
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => updateActiveText('textAlign', 'right')}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          activeObject.textAlign === 'right' ? 'border-[#C1121F] bg-[#C1121F]/10 text-white shadow' : 'border-neutral-900 text-neutral-450 hover:text-white hover:border-neutral-700'
                        }`}
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Font Size & color slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[9px] text-neutral-500 font-extrabold uppercase">
                        <span>Font Size</span>
                        <span className="font-mono text-white">{activeObject.fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="8"
                        max="80"
                        value={activeObject.fontSize}
                        onChange={(e) => updateActiveText('fontSize', parseInt(e.target.value))}
                        className="w-full accent-[#C1121F] bg-neutral-900 h-1.5 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Color selection dots */}
                    <div className="space-y-2">
                      <label className="text-[9px] text-neutral-500 font-black uppercase tracking-wider block">Text Color</label>
                      <div className="flex gap-2.5">
                        {['#ffffff', '#000000', '#C1121F', '#00ffff', '#ff00ff', '#fcd34d'].map(color => (
                          <button
                            key={color}
                            onClick={() => updateActiveText('fill', color)}
                            className={`w-6.5 h-6.5 rounded-full border cursor-pointer transition-all duration-200 hover:scale-110 shadow-sm ${
                              activeObject.fill === color ? 'border-white scale-110 shadow-md ring-2 ring-red-950/20' : 'border-neutral-900'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Rotation control */}
                    <div className="space-y-2 pt-2 border-t border-neutral-900">
                      <label className="text-[9px] text-neutral-500 font-black uppercase tracking-wider block">Rotate Text</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRotateActive(90)}
                          className="flex-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 hover:border-neutral-750 text-white font-bold py-2 rounded-xl text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Rotate +90°
                        </button>
                        <button
                          onClick={() => handleRotateActive(-90)}
                          className="flex-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 hover:border-neutral-750 text-white font-bold py-2 rounded-xl text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Rotate -90°
                        </button>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[8px] text-neutral-500 font-bold uppercase">
                          <span>Free Rotation</span>
                          <span className="font-mono text-white">{(activeObject.angle || 0).toFixed(0)}°</span>
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
                          className="w-full accent-[#C1121F] bg-neutral-900 h-1.5 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Opacity slider */}
                    <div className="space-y-1.5 pt-2 border-t border-neutral-900">
                      <div className="flex justify-between items-center text-[9px] text-neutral-500 font-extrabold uppercase">
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
                        className="w-full accent-[#C1121F] bg-neutral-900 h-1.5 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. Styling (Finishes, Materials, Size) Tab */}
            {activeTab === 'styling' && (
              <div className="space-y-6">
                {/* Orientation configuration */}
                <div className="space-y-3">
                  <h4 className="text-xs text-neutral-350 font-black uppercase tracking-widest border-b border-neutral-900 pb-2 flex items-center gap-1.5">
                    <Crop className="w-3.5 h-3.5 text-[#C1121F]" />
                    Canvas Orientation
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {(['PORTRAIT', 'LANDSCAPE', 'SQUARE'] as const).map((orient) => (
                      <button
                        key={orient}
                        onClick={() => setOrientation(orient)}
                        className={`py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer active:scale-95 ${
                          orientation === orient 
                            ? 'border-[#C1121F] bg-[#C1121F]/10 text-white shadow shadow-red-950/15' 
                            : 'border-neutral-900 bg-neutral-950/45 text-neutral-450 hover:border-neutral-750 hover:text-white'
                        }`}
                      >
                        {orient}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sizing selection */}
                <div className="space-y-3">
                  <h4 className="text-xs text-neutral-350 font-black uppercase tracking-widest border-b border-neutral-900 pb-2 flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-[#C1121F]" />
                    Poster Dimensions
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    {POSTER_SIZES.map((size) => (
                      <button
                        key={size.name}
                        onClick={() => setSizeName(size.name)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-300 active:scale-98 ${
                          sizeName === size.name 
                            ? 'border-[#C1121F] bg-[#C1121F]/10 text-white shadow shadow-red-950/15' 
                            : 'border-neutral-900 bg-neutral-950/45 text-neutral-450 hover:border-neutral-750'
                        }`}
                      >
                        <div className="text-[10px] font-black uppercase tracking-wider flex justify-between">
                          <span>{size.name}</span>
                          <span className="text-[#FF4D4D] text-[9px] font-bold">{size.additionalPrice > 0 ? `+ ₹${size.additionalPrice}` : 'Incl.'}</span>
                        </div>
                        <div className="text-[8px] text-neutral-500 font-mono mt-1 font-bold">{size.dimensions}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Paper configuration selection */}
                <div className="space-y-3">
                  <h4 className="text-xs text-neutral-350 font-black uppercase tracking-widest border-b border-neutral-900 pb-2 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#C1121F]" />
                    Paper Grade
                  </h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    {PAPER_TYPES.map((paper) => (
                      <button
                        key={paper.name}
                        onClick={() => setPaperType(paper.name)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-300 flex items-center justify-between active:scale-98 ${
                          paperType === paper.name 
                            ? 'border-[#C1121F] bg-[#C1121F]/10 text-white shadow shadow-red-950/15' 
                            : 'border-neutral-900 bg-neutral-950/45 text-neutral-450 hover:border-neutral-750'
                        }`}
                      >
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-wider">{paper.name}</div>
                          <div className="text-[9px] text-neutral-500 mt-1 font-semibold">{paper.description}</div>
                        </div>
                        <span className="text-[#FF4D4D] text-[9.5px] font-black shrink-0 ml-2">
                          {paper.additionalPrice > 0 ? `+ ₹${paper.additionalPrice}` : 'Included'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Framing options */}
                <div className="space-y-3">
                  <h4 className="text-xs text-neutral-350 font-black uppercase tracking-widest border-b border-neutral-900 pb-2 flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-[#C1121F]" />
                    Optional Frame Finish
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    {FRAME_FINISHES.map((frame) => (
                      <button
                        key={frame.name}
                        onClick={() => setFrameName(frame.name)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-300 active:scale-98 ${
                          frameName === frame.name 
                            ? 'border-[#C1121F] bg-[#C1121F]/10 text-white shadow shadow-red-950/15' 
                            : 'border-neutral-900 bg-neutral-950/45 text-neutral-450 hover:border-neutral-750'
                        }`}
                      >
                        <div className="text-[10px] font-black uppercase tracking-wider">{frame.name}</div>
                        <div className="text-[8px] text-neutral-500 mt-1 font-semibold line-clamp-1">{frame.description}</div>
                        <div className="text-[9px] text-[#FF4D4D] font-black mt-1.5">
                          {frame.additionalPrice > 0 ? `+ ₹${frame.additionalPrice}` : 'Included'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 5. Saved Designs Tab */}
            {activeTab === 'saved' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs text-neutral-350 font-black uppercase tracking-widest">My Saved Designs</h4>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Reopen or delete configurations saved under your profile.</p>
                </div>

                {isDesignsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#C1121F]" />
                  </div>
                ) : savedDesigns.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3.5">
                    {savedDesigns.map((design) => (
                      <div
                        key={design.id}
                        onClick={() => loadSavedConfig(design)}
                        className="bg-neutral-950 border border-neutral-900 hover:border-[#C1121F]/60 p-3 rounded-2xl cursor-pointer transition-all group relative flex flex-col justify-between"
                      >
                        <div className="relative w-full aspect-[3/4] bg-neutral-900 rounded-xl overflow-hidden mb-2 shadow-inner">
                          <Image
                            src={design.previewImage}
                            alt={design.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="120px"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="text-[9px] font-black text-white truncate uppercase tracking-widest">{design.name}</div>
                          <div className="text-[7.5px] text-neutral-500 font-mono font-bold">
                            {new Date(design.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                        
                        {/* Delete button overlay */}
                        <button
                          onClick={(e) => deleteSavedConfig(e, design.id)}
                          className="absolute top-2.5 right-2.5 p-1.5 bg-black/85 hover:bg-red-950 border border-neutral-850 hover:border-red-900 rounded-lg text-neutral-400 hover:text-red-400 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-neutral-950/40 border border-neutral-900 rounded-2xl space-y-2">
                    <Save className="w-7 h-7 text-neutral-700 mx-auto" />
                    <p className="text-[10px] text-neutral-550 font-bold uppercase tracking-wider">No saved designs found.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Configuration Summary footer of panel */}
          <div className="bg-neutral-950 p-6 border-t border-neutral-900 space-y-4">
            <div className="space-y-2 text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider">
              <span className="text-[9px] text-neutral-500 font-black">Design Blueprint Summary</span>
              <div className="flex justify-between border-b border-neutral-900 pb-1.5">
                <span>Poster Size ({sizeName})</span>
                <span className="text-neutral-550">
                  {POSTER_SIZES.find(s => s.name === sizeName)?.additionalPrice || 0 > 0 
                    ? `+ ₹${POSTER_SIZES.find(s => s.name === sizeName)?.additionalPrice}` 
                    : 'Included'}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-900 pb-1.5">
                <span>Paper Grade ({paperType})</span>
                <span className="text-neutral-550">
                  {PAPER_TYPES.find(p => p.name === paperType)?.additionalPrice || 0 > 0 
                    ? `+ ₹${PAPER_TYPES.find(p => p.name === paperType)?.additionalPrice}` 
                    : 'Included'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Frame Finish ({frameName})</span>
                <span className="text-neutral-550">
                  {FRAME_FINISHES.find(f => f.name === frameName)?.additionalPrice || 0 > 0 
                    ? `+ ₹${FRAME_FINISHES.find(f => f.name === frameName)?.additionalPrice}` 
                    : 'Included'}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-baseline border-t border-neutral-900 pt-3">
              <span className="text-xs text-neutral-400 font-extrabold uppercase tracking-widest">Calculated Subtotal</span>
              <span className="text-xl font-black text-white">₹{priceBreakdown.unitPrice.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </ScrollReveal>

        {/* CENTER / RIGHT COLUMN: Interactive Studio Canvas & Toolbar */}
        <div className="flex-1 flex flex-col bg-[#0F0F0F] p-6 sm:p-8 rounded-3xl border border-neutral-900 justify-between items-center relative gap-6 shadow-xl shadow-black/40">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#C1121F]/5 blur-3xl pointer-events-none"></div>

          {/* TOP BAR: Action controls toolbar */}
          <div className="w-full flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-neutral-900 pb-4.5">
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors group mr-2 font-bold uppercase tracking-wider"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-300" />
                Storefront
              </Link>
              <div className="border-l border-neutral-900 h-4 mx-1"></div>
              <span className="text-xs font-black uppercase text-neutral-450 tracking-widest">
                {cartItemId ? 'EDIT CUSTOM PRINT' : 'NEW CUSTOM DESIGN'}
              </span>
            </div>

            {/* Toolbar Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className="p-2.5 bg-neutral-950 border border-neutral-900 hover:border-neutral-750 disabled:opacity-30 rounded-xl text-neutral-350 hover:text-white transition-all cursor-pointer disabled:cursor-not-allowed active:scale-95"
                title="Undo"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={!canRedo}
                className="p-2.5 bg-neutral-950 border border-neutral-900 hover:border-neutral-750 disabled:opacity-30 rounded-xl text-neutral-350 hover:text-white transition-all cursor-pointer disabled:cursor-not-allowed active:scale-95"
                title="Redo"
              >
                <Redo2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleReset}
                className="p-2.5 bg-neutral-950 border border-neutral-900 hover:border-red-900 rounded-xl text-neutral-350 hover:text-red-400 transition-all cursor-pointer active:scale-95"
                title="Reset Design"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowSaveModal(true)}
                className="p-2.5 bg-neutral-950 border border-neutral-900 hover:border-emerald-900 rounded-xl text-neutral-350 hover:text-emerald-400 transition-all cursor-pointer active:scale-95"
                title="Save Design Layout"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Canvas Action Menu (e.g. layers, delete) */}
          {activeObject && (
            <div className="w-full flex items-center justify-between p-2.5 bg-neutral-950 border border-neutral-900 rounded-2xl max-w-md animate-fade-in shadow-lg">
              <span className="text-[9px] text-[#FF4D4D] font-black uppercase tracking-widest pl-2">
                Selected ({activeObject.type === 'i-text' ? 'Typography' : 'Artwork'})
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => changeLayer('forward')}
                  className="p-1.5 hover:bg-neutral-900 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="Bring Forward"
                >
                  <Layers className="w-3.5 h-3.5 rotate-180" />
                </button>
                <button
                  onClick={() => changeLayer('backward')}
                  className="p-1.5 hover:bg-neutral-900 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="Send Backward"
                >
                  <Layers className="w-3.5 h-3.5" />
                </button>
                <div className="border-l border-neutral-900 h-4 mx-1.5"></div>
                <button
                  onClick={() => {
                    fabricCanvas.remove(activeObject);
                    fabricCanvas.discardActiveObject();
                    fabricCanvas.renderAll();
                  }}
                  className="p-1.5 hover:bg-red-950/40 border border-transparent hover:border-red-900/40 rounded-lg text-neutral-450 hover:text-red-400 transition-all cursor-pointer"
                  title="Delete Object"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* INTERACTIVE DYNAMIC POSTER PREVIEW */}
          <div className="relative flex items-center justify-center p-8 bg-[#050505] border border-neutral-900 rounded-3xl overflow-hidden shadow-2xl w-full max-w-lg min-h-[400px]">
            <div className="absolute w-[220px] h-[220px] rounded-full bg-[#C1121F]/5 blur-3xl pointer-events-none"></div>

            {/* Framing overlay */}
            <div className={`relative transition-all duration-500 bg-[#050505] ${frameBorderClass} overflow-hidden shadow-2xl rounded-2xl`}>
              <canvas ref={canvasRef} className="shadow-lg shadow-neutral-950/90 rounded-xl" />
              
              {/* Paper overlay reflection effect */}
              <div className={`absolute inset-0 pointer-events-none mix-blend-overlay ${
                paperType === 'Glossy' 
                  ? 'bg-gradient-to-tr from-white/10 via-transparent to-white/20' 
                  : 'bg-white/[0.03]'
              }`}></div>
            </div>
          </div>

          {/* Feedback & Action Buttons */}
          <div className="w-full max-w-md space-y-4">
            {errorMsg && (
              <div className="p-4 bg-red-950/30 border border-red-900/60 text-red-300 text-xs font-bold uppercase tracking-wider rounded-xl leading-relaxed">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-4 bg-emerald-950/25 border border-emerald-900/60 text-emerald-300 text-xs font-bold uppercase tracking-wider rounded-xl leading-relaxed">
                {successMsg}
              </div>
            )}

            <div className="flex gap-4">
              {/* Quantity selector */}
              <div className="flex items-center bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden shrink-0 shadow-inner">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-2.5 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer font-bold text-sm"
                >
                  -
                </button>
                <span className="px-3.5 py-2 font-mono text-xs font-black text-white bg-neutral-950 border-x border-neutral-900 w-11 text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3.5 py-2.5 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer font-bold text-sm"
                >
                  +
                </button>
              </div>

              {/* Add to Cart button */}
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || isUploading}
                className="flex-1 inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#C1121F] to-[#FF4D4D] border-transparent text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 shadow-lg shadow-red-950/30 active:scale-97 disabled:bg-neutral-950 disabled:border-neutral-900 disabled:text-neutral-600 disabled:cursor-not-allowed cursor-pointer"
              >
                {isAddingToCart ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Processing configuration...</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 text-white" />
                    <span>{cartItemId ? 'Update Customizations' : 'Add Custom Print to Cart'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* SAVE DESIGN DIALOG MODAL */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#0F0F0F] border border-neutral-900 rounded-3xl p-6 w-full max-w-sm space-y-4.5 shadow-2xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-white border-b border-neutral-900 pb-3 flex items-center gap-2">
              <Save className="w-4.5 h-4.5 text-[#C1121F]" />
              Save Layout Configurations
            </h3>
            <p className="text-[10px] text-neutral-450 font-bold uppercase tracking-wider leading-relaxed">Give your layout configuration a name to retrieve it anytime from this studio.</p>
            
            <input
              type="text"
              placeholder="e.g. My Bedroom Collage"
              value={saveDesignName}
              onChange={(e) => setSaveDesignName(e.target.value)}
              className="w-full px-4 py-3.5 bg-neutral-950 border border-neutral-900 rounded-xl text-xs font-semibold text-white placeholder-neutral-700 focus:outline-none focus:border-[#C1121F] transition-colors"
            />

            <div className="flex gap-3 justify-end pt-2 text-[10px] font-black uppercase tracking-widest">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveDesignName('');
                }}
                className="px-4.5 py-2.5 border border-neutral-900 rounded-xl text-neutral-450 hover:text-white hover:bg-neutral-950 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDesign}
                disabled={isSavingDesign || !saveDesignName.trim()}
                className="px-5 py-2.5 bg-[#C1121F] hover:bg-[#A00F19] disabled:bg-neutral-950 border border-transparent disabled:border-neutral-900 text-white disabled:text-neutral-600 rounded-xl font-bold cursor-pointer transition-colors"
              >
                {isSavingDesign ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function CustomPosterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-transparent text-[#F5F5F5] flex items-center justify-center font-bold uppercase tracking-widest text-xs">Loading designer...</div>}>
      <ConfiguratorContent />
    </Suspense>
  );
}
