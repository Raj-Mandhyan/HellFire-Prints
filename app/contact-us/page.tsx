'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, Phone, MapPin, Clock, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import React, { useState } from 'react';

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Support Request',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [ticketId, setTicketId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    // Simulate standard e-commerce ticket generation
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      const randomTicket = 'HF-' + Math.floor(100000 + Math.random() * 900000);
      setTicketId(randomTicket);
      setFormData({ name: '', email: '', subject: 'Support Request', message: '' });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-transparent text-[#F5F5F5] flex flex-col font-sans selection:bg-[#C1121F] selection:text-white overflow-x-hidden">
      {/* Brand Navigation Header */}
      <Navbar />

      {/* Atmospheric Glow Elements */}
      <div className="absolute top-[15%] left-[5%] w-[400px] h-[400px] rounded-full bg-[#C1121F]/5 blur-[130px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[5%] w-[350px] h-[350px] rounded-full bg-[#f77f00]/3 blur-[120px] -z-10 pointer-events-none" />

      {/* Main Container */}
      <main className="flex-grow max-w-6xl mx-auto px-6 py-16 w-full relative z-10">
        
        {/* Header Block */}
        <div className="mb-12 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-neutral-950/60 border border-neutral-900 rounded-full text-[10px] font-black text-[#FF4D4D] tracking-widest uppercase">
            <MessageSquare className="w-3.5 h-3.5 text-[#C1121F]" />
            Connect With Us
          </div>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white">
            Contact <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C1121F] via-[#FF4D4D] to-[#f77f00] fiery-text-glow font-black">Us</span>
          </h1>
          <p className="max-w-xl mx-auto text-neutral-400 text-xs sm:text-sm font-semibold leading-relaxed">
            Have questions about custom studio specs, existing order transit, or high-contrast framing sizes? Fire a message over or use the direct channels below.
          </p>
        </div>

        {/* Contact Info & Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          
          {/* Left: Contact Channels */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="premium-glass p-6 sm:p-8 rounded-3xl border border-neutral-900/60 space-y-6">
              <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-3">
                Direct Channels
              </h2>

              <div className="space-y-5">
                {/* Channel: Email */}
                <div className="flex gap-4">
                  <div className="bg-[#C1121F]/10 border border-[#C1121F]/20 p-3 rounded-2xl h-fit">
                    <Mail className="w-5 h-5 text-[#C1121F]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest">Customer Support</p>
                    <p className="text-sm font-mono text-[#FF4D4D] font-bold">biswasbp10@gmail.com</p>
                  </div>
                </div>

                {/* Channel: Phone */}
                <div className="flex gap-4">
                  <div className="bg-[#C1121F]/10 border border-[#C1121F]/20 p-3 rounded-2xl h-fit">
                    <Phone className="w-5 h-5 text-[#C1121F]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest">Support Hotline</p>
                    <p className="text-sm font-mono text-white font-bold">+91 93823 65039</p>
                  </div>
                </div>

                {/* Channel: Address */}
                <div className="flex gap-4">
                  <div className="bg-[#C1121F]/10 border border-[#C1121F]/20 p-3 rounded-2xl h-fit">
                    <MapPin className="w-5 h-5 text-[#C1121F]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest">Registered Office</p>
                    <p className="text-xs text-neutral-300 font-semibold leading-relaxed whitespace-pre-line">H-16, Room:409, IIEST Shibpur, Howrah, West Bengal, India.</p>
                  </div>
                </div>

                {/* Channel: Hours */}
                <div className="flex gap-4">
                  <div className="bg-[#C1121F]/10 border border-[#C1121F]/20 p-3 rounded-2xl h-fit">
                    <Clock className="w-5 h-5 text-[#C1121F]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest">Support Hours</p>
                    <p className="text-xs text-neutral-300 font-semibold">Monday – Saturday: 10:00 AM – 6:00 PM IST</p>
                    <p className="text-[10px] text-neutral-500">We respond to email tickets within 24 hours.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Note Card */}
            <div className="premium-glass p-6 rounded-3xl border border-neutral-900/60 bg-gradient-to-br from-neutral-950 to-neutral-900/40">
              <p className="text-xs text-neutral-450 font-semibold leading-relaxed">
                📢 <strong>Filing a damaged item claim?</strong> Please remember to use the email address listed above and attach unboxing images/video along with your order details to ensure immediate clearance.
              </p>
            </div>
          </div>

          {/* Right: Message Form */}
          <div className="lg:col-span-3">
            <div className="premium-glass p-8 sm:p-10 rounded-3xl border border-neutral-900/60 shadow-2xl relative">
              <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-900 pb-3 mb-6">
                Fire a Support Ticket
              </h2>

              {submitStatus === 'success' ? (
                <div className="py-12 px-4 text-center space-y-5 animate-fade-in">
                  <div className="inline-flex items-center justify-center p-3.5 bg-green-950/20 border border-green-900/40 rounded-full text-green-400">
                    <CheckCircle2 className="w-12 h-12 text-[#FF4D4D]" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-lg text-white uppercase tracking-wider">Ticket Logged Successfully</h3>
                    <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                      Your query has been securely registered under support ID <strong className="text-white font-mono">{ticketId}</strong>. A copy of this ticket has been sent to your email.
                    </p>
                  </div>
                  <button
                    onClick={() => setSubmitStatus('idle')}
                    className="inline-flex items-center justify-center bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-800 text-xs px-6 py-2.5 rounded-xl font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label htmlFor="form-name" className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest pl-1">Your Name</label>
                      <input
                        id="form-name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full bg-neutral-950/80 border border-neutral-900/80 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-600 focus:outline-none transition-all"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label htmlFor="form-email" className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest pl-1">Your Email</label>
                      <input
                        id="form-email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        className="w-full bg-neutral-950/80 border border-neutral-900/80 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-600 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Subject Selector */}
                  <div className="space-y-1.5">
                    <label htmlFor="form-subject" className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest pl-1">Inquiry Category</label>
                    <select
                      id="form-subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full bg-neutral-950/80 border border-neutral-900/80 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-all"
                    >
                      <option value="Support Request">General Support / Inquiry</option>
                      <option value="Custom Studio Issue">Custom Poster Studio Specs</option>
                      <option value="Delivery Delay">Shipping Delay / Address Update</option>
                      <option value="Damage Claim">Damaged Item Claim</option>
                      <option value="Payment Inquiry">Razorpay Payment Inquiry</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <label htmlFor="form-message" className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest pl-1">Your Message</label>
                    <textarea
                      id="form-message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Detail your request here..."
                      className="w-full bg-neutral-950/80 border border-neutral-900/80 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-600 focus:outline-none transition-all resize-none"
                    />
                  </div>

                  {submitStatus === 'error' && (
                    <p className="text-xs text-[#FF4D4D] font-bold pl-1">Please fill in all required form fields.</p>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#C1121F] to-[#FF4D4D] text-white py-3.5 rounded-xl font-black uppercase text-xs tracking-wider transition-all hover:scale-102 active:scale-98 fiery-button-glow disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>Processing Ticket...</>
                    ) : (
                      <>
                        Ignite Message
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
