import { useEffect } from 'react';

const useSEO = ({ title, description, keywords }) => {
    useEffect(() => {
        if (title) {
            document.title = title;
            const ogTitle = document.querySelector('meta[property="og:title"]');
            const twitterTitle = document.querySelector('meta[property="twitter:title"]');
            const metaTitle = document.querySelector('meta[name="title"]');
            
            if (ogTitle) ogTitle.setAttribute('content', title);
            if (twitterTitle) twitterTitle.setAttribute('content', title);
            if (metaTitle) metaTitle.setAttribute('content', title);
        }
        
        if (description) {
            const metaDescription = document.querySelector('meta[name="description"]');
            const ogDesc = document.querySelector('meta[property="og:description"]');
            const twitterDesc = document.querySelector('meta[property="twitter:description"]');
            
            if (metaDescription) metaDescription.setAttribute('content', description);
            if (ogDesc) ogDesc.setAttribute('content', description);
            if (twitterDesc) twitterDesc.setAttribute('content', description);
        }
        
        if (keywords) {
            const metaKeywords = document.querySelector('meta[name="keywords"]');
            if (metaKeywords) metaKeywords.setAttribute('content', keywords);
        }
    }, [title, description, keywords]);
};

export default useSEO;
