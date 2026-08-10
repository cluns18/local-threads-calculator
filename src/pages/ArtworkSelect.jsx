import React, { useState } from 'react';
import NavBtn from '../components/NavBtn';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebaseConfig';

export default function ArtworkSelect({ onNext, onPrevious, setUploadedImage, setArtworkDescription }) {
    const [imageFile, setImageFile] = useState(null);
    // 'idle' | 'uploading' | 'success' | 'error'
    const [status, setStatus] = useState('idle');

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setImageFile(file);
        setStatus('uploading');
        setUploadedImage(`pending:${file.name}`);

        // Unique key so two customers uploading e.g. "logo.png" never overwrite
        // each other, which would send the shop the wrong artwork.
        //
        // Must stay FLAT under uploads/. The bucket's rules are
        // `match /uploads/{fileName}`, a single path segment, so a nested key
        // falls through to the catch-all deny and 403s.
        const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, '_');
        const storageRef = ref(storage, `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`);
        try {
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            setUploadedImage(downloadURL);
            setStatus('success');
        } catch (error) {
            // Leave the `pending:` marker so the shop's quote email still flags
            // the incomplete upload, and tell the customer plainly so the art
            // is never silently lost.
            console.error('Error uploading file:', error);
            setStatus('error');
        }
    };

    const handleNext = () => {
        // Don't let the customer advance (and submit) mid-upload, or the quote
        // would send before the art lands.
        if (status === 'uploading') return;
        onNext();
    };

    return (
        <>
            <div className='slide-header'>
                <h1 className='text-3xl font-bold headingColor'>Add Your Artwork</h1>
                <p className='mt-1 text-sm bodyColor'>
                    Upload a file or describe what you have in mind. We can work with either.
                </p>
            </div>
            <div className='slide-content'>
                <div className='text-left space-y-4'>
                    <div>
                        <label className='block text-base font-semibold headingColor mb-2'>Upload Design File</label>
                        <p className='text-xs bodyColor mb-2'>Supported formats: JPG, PNG, PDF, AI, EPS, SVG</p>
                        <input
                            type='file'
                            accept='image/*,.pdf,.ai,.eps,.svg'
                            onChange={handleFileUpload}
                            className='w-full text-sm'
                        />
                        {imageFile && status === 'uploading' && (
                            <p className='text-xs mt-2' style={{ fontWeight: 600 }}>
                                Uploading {imageFile.name}...
                            </p>
                        )}
                        {imageFile && status === 'success' && (
                            <p className='text-xs mt-2' style={{ color: '#0F7B3F', fontWeight: 600 }}>
                                Uploaded: {imageFile.name}
                            </p>
                        )}
                        {imageFile && status === 'error' && (
                            <div className='mt-2 p-3 rounded-lg' style={{ background: '#FDE8E8', border: '1px solid #F5B5B5' }}>
                                <p className='text-xs' style={{ color: '#B42318', fontWeight: 700 }}>
                                    Your file didn't finish uploading.
                                </p>
                                <p className='text-xs mt-1' style={{ color: '#7A1B12' }}>
                                    Please try again, or just describe your design below and we'll
                                    follow up by email to collect the artwork. Your quote will still go through.
                                </p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className='block text-base font-semibold headingColor mb-2'>Or Describe Your Design</label>
                        <p className='text-xs bodyColor mb-2'>Tell us about your design, colors, and layout.</p>
                        <textarea
                            placeholder='Describe your design in detail...'
                            onChange={(e) => setArtworkDescription(e.target.value)}
                            className='w-full p-3 border-2 rounded-lg h-24 resize-none transition text-sm'
                            style={{ fontFamily: 'var(--lt-font-body)' }}
                        />
                    </div>
                </div>
            </div>
            <div className='slide-nav'>
                <NavBtn onClick={onPrevious} direction='prev'>&larr; Prev</NavBtn>
                <NavBtn onClick={handleNext}>{status === 'uploading' ? 'Uploading…' : <>Next &rarr;</>}</NavBtn>
            </div>
        </>
    );
}
