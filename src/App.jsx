import React, { useState, useEffect } from 'react';
import './App.css';
import { fetchPricing } from './utils/fetchPricing';
import { initAnalytics, trackFunnelStep } from './utils/analytics';
import IntroSlide from './pages/IntroSlide';
import GarmentTypeSelect from './pages/GarmentTypeSelect';
import GarmentModelSelect from './pages/GarmentModelSelect';
import PatchTypeSelect from './pages/PatchTypeSelect';
import PatchSizeSelect from './pages/PatchSizeSelect';
import ArtworkSelect from './pages/ArtworkSelect';
import LocationSelect from './pages/LocationSelect';
import ColorCount from './pages/ColorCount';
import ThreadCount from './pages/ThreadCount';
import ColorSelect from './pages/ColorSelect';
import FinalQuote from './pages/FinalQuote';
import ThankYou from './pages/ThankYou';

function App() {
    const [pricingData, setPricingData] = useState(null);
    const [pricingError, setPricingError] = useState(false);
    const [currentSlide, setCurrentSlide] = useState('intro');
    const [slideHistory, setSlideHistory] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedGarmentType, setSelectedGarmentType] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);
    const [selectedGarment, setSelectedGarment] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedPatchType, setSelectedPatchType] = useState(null);
    const [selectedPatchSize, setSelectedPatchSize] = useState(null);
    const [selectedArtwork, setSelectedArtwork] = useState(null);
    const [artworkDescription, setArtworkDescription] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState([]);
    const [locationColorCounts, setLocationColorCounts] = useState({});
    const [locationThreadCounts, setLocationThreadCounts] = useState({});
    const [finalQuote, setFinalQuote] = useState(null);
    const [hasError, setHasError] = useState(false);

    // Fetch pricing from Google Sheets on mount
    useEffect(() => {
        fetchPricing()
            .then(data => setPricingData(data))
            .catch(() => setPricingError(true));
    }, []);

    // Analytics: init once, then log every slide the user reaches so drop-off
    // between steps is measurable (funnel + Clarity heatmaps/replays).
    useEffect(() => {
        initAnalytics();
    }, []);
    useEffect(() => {
        trackFunnelStep(currentSlide);
    }, [currentSlide]);

    const handleNext = () => {
        let nextSlide = '';
        let isValid = true;

        if (currentSlide === 'intro' && !selectedProject) isValid = false;
        else if (currentSlide === 'garmentType' && !selectedGarmentType) isValid = false;
        else if (currentSlide === 'garmentModel' && !selectedModel) isValid = false;
        else if (currentSlide === 'patchType' && !selectedPatchType) isValid = false;
        else if (currentSlide === 'patchSize' && !selectedPatchSize) isValid = false;
        else if (currentSlide === 'colorSelect' && !selectedColor) isValid = false;
        else if (currentSlide === 'artworkSelect' && !(selectedArtwork || artworkDescription)) isValid = false;
        else if (currentSlide === 'locationSelect' && selectedLocation.length === 0) isValid = false;

        if (!isValid) {
            setHasError(true);
            setTimeout(() => setHasError(false), 1000);
            return;
        }

        setHasError(false);

        // Determine next slide
        if (currentSlide === 'intro') {
            if (selectedProject === 'patches') nextSlide = 'patchType';
            else nextSlide = 'garmentType';
        }
        else if (currentSlide === 'garmentType') nextSlide = 'garmentModel';
        else if (currentSlide === 'garmentModel') {
            if (selectedGarment && selectedGarment.colors?.length) nextSlide = 'colorSelect';
            else nextSlide = 'artworkSelect';
        }
        else if (currentSlide === 'colorSelect') nextSlide = 'artworkSelect';
        else if (currentSlide === 'patchType') nextSlide = 'patchSize';
        else if (currentSlide === 'patchSize') nextSlide = 'artworkSelect';
        else if (currentSlide === 'artworkSelect') {
            if (selectedProject === 'patches') nextSlide = 'finalQuote';
            else nextSlide = 'locationSelect';
        }
        else if (currentSlide === 'locationSelect') {
            if (selectedProject === 'screenPrinting') nextSlide = 'colorCount';
            else nextSlide = 'threadCount';
        }
        else if (currentSlide === 'colorCount' || currentSlide === 'threadCount') nextSlide = 'finalQuote';
        else if (currentSlide === 'finalQuote') nextSlide = 'thankYou';

        if (nextSlide) {
            setSlideHistory([...slideHistory, currentSlide]);
            setCurrentSlide(nextSlide);
        }
    };

    const handlePrevious = () => {
        if (slideHistory.length > 0) {
            const previousSlide = slideHistory[slideHistory.length - 1];

            // Reset state when going back
            if (previousSlide === 'garmentType') { setSelectedModel(null); setSelectedGarment(null); setSelectedColor(null); }
            if (previousSlide === 'garmentModel') { setSelectedColor(null); }
            if (previousSlide === 'intro') { setSelectedGarmentType(null); setSelectedPatchType(null); }
            if (previousSlide === 'locationSelect') { setLocationColorCounts({}); setLocationThreadCounts({}); }

            const newHistory = slideHistory.slice(0, -1);
            setCurrentSlide(previousSlide);
            setSlideHistory(newHistory);
        }
    };

    useEffect(() => {
        const stepMap = {
            intro: '1 - Project Type',
            garmentType: '2 - Garment Type',
            garmentModel: '3 - Garment Select',
            patchType: '2 - Patch Type',
            patchSize: '3 - Patch Size',
            colorSelect: '5 - Color',
            artworkSelect: '6 - Artwork',
            locationSelect: '7 - Location',
            colorCount: '8 - Color Count',
            threadCount: '8 - Thread Count',
            finalQuote: '9 - Quote',
            thankYou: '10 - Confirmation'
        };

        window.parent.postMessage(
            {
                event: 'calculator_slide_view',
                calcSlideName: currentSlide,
                calcStepName: stepMap[currentSlide] || currentSlide,
            },
            '*'
        );
    }, [currentSlide]);

    if (pricingError) {
        return (
            <div className='slide-container'>
                <div className='slide-page' style={{ justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
                    <h1 className='text-xl font-bold headingColor text-center'>Unable to Load Pricing</h1>
                    <p className='bodyColor text-center mt-2'>Please refresh the page or contact us at orders@localthreadsohio.com</p>
                </div>
            </div>
        );
    }

    if (!pricingData) {
        return (
            <div className='slide-container'>
                <div className='slide-page' style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <p className='bodyColor'>Loading pricing...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`slide-container ${hasError ? 'error-shake' : ''}`}>
            <div className='slide-page'>
                {currentSlide === 'intro' && (
                    <IntroSlide
                        selectedProject={selectedProject}
                        setSelectedProject={setSelectedProject}
                        onNext={handleNext}
                    />
                )}
                {currentSlide === 'garmentType' && (
                    <GarmentTypeSelect
                        selectedProject={selectedProject}
                        selectedGarmentType={selectedGarmentType}
                        setSelectedGarmentType={setSelectedGarmentType}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                    />
                )}
                {currentSlide === 'garmentModel' && (
                    <GarmentModelSelect
                        pricingData={pricingData}
                        selectedGarmentType={selectedGarmentType}
                        selectedModel={selectedModel}
                        setSelectedModel={setSelectedModel}
                        selectedGarment={selectedGarment}
                        setSelectedGarment={setSelectedGarment}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                    />
                )}
                {currentSlide === 'colorSelect' && (
                    <ColorSelect
                        selectedGarment={selectedGarment}
                        selectedColor={selectedColor}
                        setSelectedColor={setSelectedColor}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                    />
                )}
                {currentSlide === 'patchType' && (
                    <PatchTypeSelect
                        selectedPatchType={selectedPatchType}
                        setSelectedPatchType={setSelectedPatchType}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                    />
                )}
                {currentSlide === 'patchSize' && (
                    <PatchSizeSelect
                        selectedPatchType={selectedPatchType}
                        selectedPatchSize={selectedPatchSize}
                        setSelectedPatchSize={setSelectedPatchSize}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                    />
                )}
                {currentSlide === 'artworkSelect' && (
                    <ArtworkSelect
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        setUploadedImage={setSelectedArtwork}
                        setArtworkDescription={setArtworkDescription}
                    />
                )}
                {currentSlide === 'locationSelect' && (
                    <LocationSelect
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        selectedGarmentType={selectedGarmentType}
                        selectedProject={selectedProject}
                        setSelectedLocation={setSelectedLocation}
                    />
                )}
                {currentSlide === 'colorCount' && (
                    <ColorCount
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        selectedLocations={selectedLocation}
                        setColorCounts={setLocationColorCounts}
                    />
                )}
                {currentSlide === 'threadCount' && (
                    <ThreadCount
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        selectedLocations={selectedLocation}
                        locationThreadCounts={locationThreadCounts}
                        setLocationThreadCounts={setLocationThreadCounts}
                    />
                )}
                {currentSlide === 'finalQuote' && (
                    <FinalQuote
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        pricingData={pricingData}
                        selectedProject={selectedProject}
                        selectedGarmentType={selectedGarmentType}
                        selectedModel={selectedModel}
                        selectedGarment={selectedGarment}
                        selectedColor={selectedColor}
                        selectedArtwork={selectedArtwork}
                        artworkDescription={artworkDescription}
                        selectedLocation={selectedLocation}
                        locationColorCounts={locationColorCounts}
                        locationThreadCounts={locationThreadCounts}
                        selectedPatchType={selectedPatchType}
                        selectedPatchSize={selectedPatchSize}
                        setFinalQuote={setFinalQuote}
                    />
                )}
                {currentSlide === 'thankYou' && (
                    <ThankYou />
                )}
            </div>
            {hasError && <p className="error-message" style={{ position: 'absolute', bottom: '8px', left: 0, right: 0 }}>Please make a selection to proceed.</p>}
        </div>
    );
}

export default App;
