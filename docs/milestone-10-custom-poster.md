# Milestone 10 — Custom Poster Configurator Studio

This document explains the architecture, specifications, and data structures implemented for the **Custom Poster Configurator Studio** in Hellfire Prints.

---

## 1. Architectural Flow

The Custom Poster Configurator allows customers to build custom poster designs using an interactive Fabric.js canvas, choose material finishes, save configurations in their profile, and check out securely.

```mermaid
graph TD
  User[Customer] -->|Interactive Canvas| Configurator[Custom Poster Configurator]
  Configurator -->|Upload raw images| UploadAPI[/api/upload]
  UploadAPI -->|Store secure stream| Cloudinary[Cloudinary CDN]
  
  Configurator -->|Save layout JSON| DesignsAPI[/api/custom-poster/designs]
  DesignsAPI -->|Persist| DB[(Neon PostgreSQL)]
  
  Configurator -->|Render preview & add to cart| CartAPI[/api/cart]
  CartAPI -->|Calculate Price Securely| Pricing[Pricing Engine]
  CartAPI -->|Attach Custom Poster| DB
```

---

## 2. Configurator Canvas Editor

The editor is built using **Fabric.js** (loaded dynamically on the client side to bypass SSR constraints).

### Key Features
* **Clips Boundaries:** Ensures that uploaded images and text objects remain constrained inside the canvas boundaries (no overflow).
* **Starter Templates:** Data-driven configurations including:
  * *Blank Slate*
  * *Minimalist Art*
  * *Cinema Classic*
  * *Bold Quote*
  * *Futuristic Cyber*
* **Dynamic Sizing & Aspect Ratios:** Dimensions resize dynamically when sizes (A4, A3, A2, 12x18", 18x24", 24x36") and orientations (Portrait, Landscape, Square) are updated.
* **Undo & Redo Engine:** Manages a history state stack of canvas JSON configurations, enabling instant restoration.
* **Object Management:** Reorder object layered sequence (front, back, forward, backward) or delete selected elements.

---

## 3. Customization Data Structure

Custom poster configurations are serialized and saved in the database under `CustomPoster` in the `configuration` JSONB field.

### Sample Configuration JSON
```json
{
  "version": "5.3.0",
  "objects": [
    {
      "type": "image",
      "version": "5.3.0",
      "left": 50,
      "top": 80,
      "width": 600,
      "height": 400,
      "scaleX": 0.35,
      "scaleY": 0.35,
      "src": "https://res.cloudinary.com/demo/image/upload/v12345/hellfire-prints-custom/artwork.png",
      "cloudinaryUrl": "https://res.cloudinary.com/demo/image/upload/v12345/hellfire-prints-custom/artwork.png",
      "publicId": "hellfire-prints-custom/artwork"
    },
    {
      "type": "i-text",
      "version": "5.3.0",
      "left": 80,
      "top": 380,
      "width": 200,
      "height": 35,
      "text": "DARK SILENCE",
      "fontFamily": "Cinzel",
      "fontSize": 32,
      "fill": "#ffffff",
      "fontWeight": "bold",
      "textAlign": "center"
    }
  ],
  "background": "#0a0a0a"
}
```

---

## 4. Secure Pricing Engine

Pricing calculations are calculated server-side inside `lib/customPosterPricing.ts` to prevent client-side price injections.

* **Base Price:** ₹499
* **Sizing Additions:**
  * A4: +₹0
  * A3: +₹199
  * A2: +₹449
  * 12 × 18 inch: +₹249
  * 18 × 24 inch: +₹549
  * 24 × 36 inch: +₹999
* **Paper Additions:**
  * Matte: +₹0
  * Glossy: +₹49
  * Premium Matte: +₹99
  * Fine Art: +₹199
* **Framing Additions:**
  * No Frame: +₹0
  * Black: +₹149
  * White: +₹149
  * Wooden: +₹299

---

## 5. Integration Summary

1. **Cart Integration:** Cart items with custom posters are identified by a unique `customPosterId`. Clicking **Edit Customization** loads the exact state from the database back onto the canvas.
2. **Checkout & Order Flow:** Custom poster pricing flows securely into subtotal calculations. Orders preserve direct links to custom poster previews and source high-res graphics.
3. **Saved Designs:** Users can save layouts under named profiles via `/api/custom-poster/designs` and reload them on demand.
4. **Image Storage:** Done via `/api/upload` endpoint, validating type (PNG, JPG, JPEG, WEBP) and size (<15MB), streaming directly to Cloudinary.

---

## 6. Security Considerations

* **Credential Protection:** Cloudinary API keys and signatures are never exposed to the client. All uploads are processed server-side.
* **Price Verification:** Client price parameters are ignored; the server recalculates poster subtotals on adding or checking out.
* **User Isolation:** Saved designs and editing states verify that the logged-in user owns the design or the cart item, preventing cross-user updates.
