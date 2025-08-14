// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs-dist/build/pdf.worker.js';

let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
const pdfContainer = document.querySelector('.pdf-container');
const pageNumSpan = document.querySelector('#page-num');
const pageTotalSpan = document.querySelector('#page-count');

// Function to render a specific page in a specific canvas
async function renderPage(pageNumber, canvasElement) {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.5 });
    
    canvasElement.height = viewport.height;
    canvasElement.width = viewport.width;

    const renderContext = {
        canvasContext: canvasElement.getContext('2d'),
        viewport: viewport
    };

    return page.render(renderContext).promise;
}

// Function to display 6 pages at once
async function renderCurrentPages() {
    pdfContainer.innerHTML = '';
    const startPage = Math.floor((pageNum - 1) / 6) * 6 + 1;
    
    for (let i = 0; i < 6; i++) {
        const currentPage = startPage + i;
        if (currentPage <= pdfDoc.numPages) {
            const card = document.createElement('div');
            card.className = 'pdf-card';
            
            const canvas = document.createElement('canvas');
            card.appendChild(canvas);
            pdfContainer.appendChild(card);
            
            await renderPage(currentPage, canvas);
        }
    }
    
    pageNumSpan.textContent = startPage;
    pageTotalSpan.textContent = pdfDoc.numPages;
}

// Load the PDF
pdfjsLib.getDocument('/ssl-topics.pdf').promise.then(function(pdfDoc_) {
    pdfDoc = pdfDoc_;
    renderCurrentPages();
    
    document.getElementById('prev').addEventListener('click', function() {
        if (pageNum <= 6) return;
        pageNum -= 6;
        renderCurrentPages();
    });

    document.getElementById('next').addEventListener('click', function() {
        if (pageNum > pdfDoc.numPages - 6) return;
        pageNum += 6;
        renderCurrentPages();
    });
});
