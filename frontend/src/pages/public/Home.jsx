import React from 'react';
import Navbar from '../../components/common/Navbar';
import Hero from '../../components/public/Hero';
import SearchPrice from '../../components/public/SearchPrice';
import OurNetwork from '../../components/public/OurNetwork';
import WhyChooseUs from '../../components/public/WhyChooseUs';
import HowItWorks from '../../components/public/HowItWorks';
import LiveActivity from '../../components/public/LiveActivity';
import WhoWeConnect from '../../components/public/WhoWeConnect';
import GetInTouch from '../../components/common/GetInTouch';
import FAQ from '../../components/public/FAQ';
import WhatsAppButton from '../../components/public/WhatsAppButton';
import useSEO from '../../hooks/useSEO';

const Home = () => {
    useSEO({
        title: 'Logistics Scanner - Compare Freight Rates & Find Trusted Logistics Vendors',
        description: 'Compare real-time freight rates from verified logistics vendors. Logistics Scanner helps businesses find reliable shipping partners for air, sea, and land transport.',
        keywords: 'logistics scanner, freight rate comparison, shipping rates online, logistics platform India, freight forwarding services'
    });

    return (
        <div className="bg-dark-900 min-h-screen selection:bg-gold selection:text-black">
            <Navbar />
            <Hero />
            <SearchPrice />
            <OurNetwork />
            <WhyChooseUs />
            <HowItWorks />
            <LiveActivity />
            <WhoWeConnect />
            <GetInTouch />
            <FAQ />
        </div>
    );
};

export default Home;
