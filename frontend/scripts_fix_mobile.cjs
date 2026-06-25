const fs = require('fs');
const file = 'e:/logostics_scanner/frontend/src/components/public/SearchPrice.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<div className="lg:col-span-1">(\s*<button\s+type="submit"[^>]*>\s*Search\s*<\/button>\s*)<\/div>/g, '<div className="lg:col-span-1 hidden lg:block"></div>');

const formEndRegex = /(<\/form>\s*)({\/\* Search Results Display Section \*\/})/s;
if (formEndRegex.test(content)) {
    const mobileBtn = "\n                            {/* Mobile-only Search Button (always at bottom) */}\n                            <div className=\"block lg:hidden w-full pt-2\">\n                                <button\n                                    type=\"submit\"\n                                    className=\"w-full bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-black py-4 rounded-xl transition-all shadow-md shadow-[#0066FF]/10 uppercase tracking-wider cursor-pointer\"\n                                >\n                                    Search\n                                </button>\n                            </div>\n";
    content = content.replace(formEndRegex, mobileBtn + '');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Success');
} else {
    console.log('Could not find form end regex');
}
