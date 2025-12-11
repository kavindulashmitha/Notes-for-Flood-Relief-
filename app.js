// Supabase Configuration
const supabaseUrl = 'https://krzassqvxrpyzmbhaijw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyemFzc3F2eHJweXptYmhhaWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NjIyNDcsImV4cCI6MjA4MDEzODI0N30.t_muaLOblCqjMnBhZAX-x272oxB7m4OFuAFzz4r45hA';

// App Configuration - 1GB FILE SUPPORT
const MAX_FILE_MB = 1024; // 1GB = 1024 MB

// Initialize Supabase
let supabase;
try {
    supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    console.log("✅ Supabase initialized");
} catch (error) {
    console.error("❌ Supabase initialization failed:", error);
}

// App State
let currentLang = localStorage.getItem('lang') || 'en';
let resources = [];
let flaggedItems = [];

// DOM Elements
const elements = {
    search: document.getElementById('search'),
    gradeFilter: document.getElementById('grade-filter'),
    fileInput: document.getElementById('file-input'),
    uploadBtn: document.getElementById('upload-btn'),
    uploadModal: document.getElementById('upload-modal'),
    closeModal: document.getElementById('close-modal'),
    cancelUpload: document.getElementById('cancel-upload'),
    submitUpload: document.getElementById('submit-upload'),
    resourcesList: document.getElementById('resources-list'),
    sectionsView: document.getElementById('sections-view'),
    listViewBtn: document.getElementById('list-view'),
    sectionViewBtn: document.getElementById('section-view'),
    resultsCount: document.getElementById('results-count'),
    langToggle: document.getElementById('lang-toggle')
};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 App starting...");
    console.log("📁 Max file size: " + MAX_FILE_MB + " MB (" + (MAX_FILE_MB/1024).toFixed(1) + " GB)");
    
    // Set up event listeners
    setupEventListeners();
    
    // Load resources
    loadResources();
    
    // Apply language
    applyLanguage();
    
    console.log("✅ App initialized");
});

// Event Listeners
function setupEventListeners() {
    // Upload button
    elements.uploadBtn?.addEventListener('click', function() {
        console.log("📁 Upload button clicked");
        elements.fileInput.click();
    });
    
    // File input change
    elements.fileInput?.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            console.log("📄 File selected:", file.name, "Size:", formatFileSize(file.size));
            
            // Show file info in modal
            document.getElementById('selected-file').textContent = file.name;
            document.getElementById('file-size').textContent = formatFileSize(file.size);
            document.getElementById('file-info').style.display = 'block';
            
            // Show progress bar
            showUploadProgress(0);
            
            // Show modal
            elements.uploadModal.style.display = 'block';
        }
    });
    
    // University fields toggle
    document.getElementById('modal-grade')?.addEventListener('change', function() {
        const universityFields = document.getElementById('university-fields');
        if (this.value === 'University') {
            universityFields.style.display = 'block';
        } else {
            universityFields.style.display = 'none';
        }
    });
    
    // Close modal
    elements.closeModal?.addEventListener('click', closeModal);
    elements.cancelUpload?.addEventListener('click', closeModal);
    
    // Submit upload
    elements.submitUpload?.addEventListener('click', handleUpload);
    
    // Search
    elements.search?.addEventListener('input', filterResources);
    
    // Grade filter
    elements.gradeFilter?.addEventListener('change', filterResources);
    
    // View toggles
    elements.listViewBtn?.addEventListener('click', function() {
        switchView('list');
    });
    
    elements.sectionViewBtn?.addEventListener('click', function() {
        switchView('sections');
    });
    
    // Language toggle
    elements.langToggle?.addEventListener('click', toggleLanguage);
    
    // Close modal on outside click
    window.addEventListener('click', function(e) {
        if (e.target === elements.uploadModal) {
            closeModal();
        }
    });
}

// Close modal
function closeModal() {
    elements.uploadModal.style.display = 'none';
    elements.fileInput.value = '';
    document.getElementById('file-info').style.display = 'none';
    document.getElementById('university-fields').style.display = 'none';
    document.getElementById('modal-grade').value = '';
    document.getElementById('modal-campus').value = '';
    document.getElementById('modal-faculty').value = '';
    document.getElementById('modal-department').value = '';
    document.getElementById('modal-description').value = '';
    hideUploadProgress();
}

// Switch view
function switchView(view) {
    if (view === 'list') {
        elements.resourcesList.style.display = 'grid';
        elements.sectionsView.style.display = 'none';
        elements.listViewBtn.classList.add('active');
        elements.sectionViewBtn.classList.remove('active');
    } else {
        elements.resourcesList.style.display = 'none';
        elements.sectionsView.style.display = 'block';
        elements.listViewBtn.classList.remove('active');
        elements.sectionViewBtn.classList.add('active');
        renderSections();
    }
}

// Load resources from Supabase
async function loadResources() {
    try {
        console.log("📚 Loading resources...");
        
        const { data, error } = await supabase
            .from('resources')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error("❌ Error loading resources:", error);
            showNotification('Error loading resources', 'error');
            return;
        }
        
        resources = data;
        console.log(`✅ Loaded ${resources.length} resources`);
        
        renderResources();
        filterResources();
        
    } catch (error) {
        console.error("❌ Failed to load resources:", error);
        showNotification('Failed to load resources', 'error');
    }
}

// Render resources list
function renderResources(resourceList = resources) {
    const container = elements.resourcesList;
    container.innerHTML = '';
    
    if (resourceList.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-inbox"></i>
                <h3>${currentLang === 'en' ? 'No resources found' : 'සම්පත් හමු නොවීය'}</h3>
                <p>${currentLang === 'en' ? 'Be the first to upload study materials!' : 'පළමුවනුව අධ්‍යාපන ද්‍රව්‍ය උඩුගත කරන්න!'}</p>
            </div>
        `;
        return;
    }
    
    resourceList.forEach(resource => {
        const card = createResourceCard(resource);
        container.appendChild(card);
    });
    
    // Update count
    updateResultsCount(resourceList.length);
}

// Create resource card HTML
function createResourceCard(resource) {
    const div = document.createElement('div');
    div.className = 'resource-card';
    
    const fileIcon = getFileIcon(resource.name);
    const fileName = resource.original_name || resource.name;
    const fileSize = resource.size || formatFileSize(resource.file_size);
    const date = formatDate(resource.created_at);
    
    div.innerHTML = `
        <div class="resource-header">
            <div class="resource-icon">
                <i class="fas fa-${fileIcon}"></i>
            </div>
            <div class="resource-info">
                <div class="resource-title">${fileName}</div>
                ${resource.description ? `<div class="resource-description">${resource.description}</div>` : ''}
                ${resource.campus && resource.faculty ? `
                    <div class="university-details">
                        <span class="university-badge"><i class="fas fa-university"></i> ${resource.campus}</span>
                        <span class="university-badge"><i class="fas fa-graduation-cap"></i> ${resource.faculty}</span>
                        ${resource.department ? `<span class="university-badge"><i class="fas fa-building"></i> ${resource.department}</span>` : ''}
                    </div>
                ` : ''}
                <div class="resource-meta">
                    <span class="grade-tag">${resource.grade}</span>
                    <span class="download-count">
                        <i class="fas fa-download"></i> ${resource.download_count || 0}
                    </span>
                </div>
                <div class="resource-details">
                    <span>${date}</span>
                    <span>${fileSize}</span>
                </div>
            </div>
        </div>
        <div class="resource-actions">
            <button class="btn primary download-btn" data-id="${resource.id}">
                <i class="fas fa-download"></i>
                ${currentLang === 'en' ? 'Download' : 'බාගන්න'}
            </button>
            <button class="btn secondary report-btn" data-id="${resource.id}">
                <i class="fas fa-flag"></i>
            </button>
        </div>
    `;
    
    // Add event listeners to buttons
    const downloadBtn = div.querySelector('.download-btn');
    const reportBtn = div.querySelector('.report-btn');
    
    downloadBtn.addEventListener('click', () => handleDownload(resource));
    reportBtn.addEventListener('click', () => handleReport(resource));
    
    return div;
}

// Render sections view
function renderSections() {
    const container = elements.sectionsView;
    container.innerHTML = '';
    
    // Group by grade
    const grouped = {};
    resources.forEach(resource => {
        if (!grouped[resource.grade]) {
            grouped[resource.grade] = [];
        }
        grouped[resource.grade].push(resource);
    });
    
    // Sort grades
    const grades = Object.keys(grouped).sort((a, b) => {
        const order = ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 
                      'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 
                      'Grade 13', 'University'];
        return order.indexOf(a) - order.indexOf(b);
    });
    
    if (grades.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>${currentLang === 'en' ? 'No resources found' : 'සම්පත් හමු නොවීය'}</h3>
                <p>${currentLang === 'en' ? 'Be the first to upload study materials!' : 'පළමුවනුව අධ්‍යාපන ද්‍රව්‍ය උඩුගත කරන්න!'}</p>
            </div>
        `;
        return;
    }
    
    grades.forEach(grade => {
        const section = document.createElement('div');
        section.className = 'section-card';
        
        section.innerHTML = `
            <div class="section-header">
                <div class="section-title">
                    <h3>${grade}</h3>
                    <span class="section-count">${grouped[grade].length} resources</span>
                </div>
            </div>
            <div class="section-resources">
                <!-- Resources will be added here -->
            </div>
        `;
        
        const resourcesContainer = section.querySelector('.section-resources');
        grouped[grade].forEach(resource => {
            const card = createResourceCard(resource);
            resourcesContainer.appendChild(card);
        });
        
        container.appendChild(section);
    });
    
    updateResultsCount(resources.length);
}

// Filter resources
function filterResources() {
    const searchTerm = elements.search.value.toLowerCase();
    const grade = elements.gradeFilter.value;
    
    let filtered = resources;
    
    // Filter by grade
    if (grade !== 'all') {
        filtered = filtered.filter(r => r.grade === grade);
    }
    
    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(r => 
            (r.name && r.name.toLowerCase().includes(searchTerm)) ||
            (r.original_name && r.original_name.toLowerCase().includes(searchTerm)) ||
            (r.description && r.description.toLowerCase().includes(searchTerm)) ||
            (r.grade && r.grade.toLowerCase().includes(searchTerm)) ||
            (r.campus && r.campus.toLowerCase().includes(searchTerm)) ||
            (r.faculty && r.faculty.toLowerCase().includes(searchTerm)) ||
            (r.department && r.department.toLowerCase().includes(searchTerm))
        );
    }
    
    // Render based on current view
    if (elements.resourcesList.style.display !== 'none') {
        renderResources(filtered);
    } else {
        // For sections view, we need to re-render sections with filtered data
        // For simplicity, we'll just show all and let user use search
        renderSections();
    }
}

// Handle file upload
async function handleUpload() {
    const file = elements.fileInput.files[0];
    const grade = document.getElementById('modal-grade').value;
    const description = document.getElementById('modal-description').value;
    
    // Validation
    if (!file) {
        showNotification(
            currentLang === 'en' ? 'Please select a file' : 'කරුණාකර ගොනුවක් තෝරන්න',
            'error'
        );
        return;
    }
    
    if (!grade) {
        showNotification(
            currentLang === 'en' ? 'Please select grade level' : 'කරුණාකර ශ්‍රේණි මට්ටම තෝරන්න',
            'error'
        );
        return;
    }
    
    if (!description.trim()) {
        showNotification(
            currentLang === 'en' ? 'Please add description' : 'කරුණාකර විස්තරයක් එකතු කරන්න',
            'error'
        );
        return;
    }
    
    // University specific validation
    let campus = '', faculty = '', department = '';
    if (grade === 'University') {
        campus = document.getElementById('modal-campus').value.trim();
        faculty = document.getElementById('modal-faculty').value.trim();
        department = document.getElementById('modal-department').value.trim();
        
        if (!campus) {
            showNotification(
                currentLang === 'en' ? 'Please enter campus name' : 'කරුණාකර විශ්වවිද්‍යාලයේ නම ඇතුළත් කරන්න',
                'error'
            );
            return;
        }
        
        if (!faculty) {
            showNotification(
                currentLang === 'en' ? 'Please enter faculty name' : 'කරුණාකර ප්‍රවීණ පීඨයේ නම ඇතුළත් කරන්න',
                'error'
            );
            return;
        }
        
        if (!department) {
            showNotification(
                currentLang === 'en' ? 'Please enter department name' : 'කරුණාකර විධාන පීඨයේ නම ඇතුළත් කරන්න',
                'error'
            );
            return;
        }
    }
    
    // Check file size (1GB max = 1024 MB)
    const maxBytes = MAX_FILE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
        const maxSize = MAX_FILE_MB >= 1024 ? 
            (MAX_FILE_MB/1024).toFixed(1) + ' GB' : 
            MAX_FILE_MB + ' MB';
        
        showNotification(
            currentLang === 'en' 
                ? `File size exceeds ${maxSize} limit` 
                : `ගොනුව උපරිම ප්‍රමාණය ඉක්මවයි: ${maxSize}`, 
            'error'
        );
        return;
    }
    
    // Check file type
    const allowedTypes = ['application/pdf', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'image/jpeg', 'image/png'];
    
    if (!allowedTypes.includes(file.type)) {
        showNotification(
            currentLang === 'en' 
                ? 'Only PDF, DOC, JPG, PNG files allowed' 
                : 'පමණක් PDF, DOC, JPG, PNG ගොනු ඉඩ දී ඇත',
            'error'
        );
        return;
    }
    
    try {
        // Show loading
        elements.submitUpload.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        elements.submitUpload.disabled = true;
        
        // Show upload progress
        showUploadProgress(10);
        
        // Clean filename
        const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        
        // 1. First create resource record
        showUploadProgress(30);
        
        // Create resource data object
        const resourceData = {
            name: cleanName,
            original_name: file.name,
            grade: grade,
            description: description,
            file_type: file.type,
            file_size: file.size,
            size: formatFileSize(file.size),
            download_count: 0,
            status: 'active'
        };
        
        // Add university fields if applicable
        if (grade === 'University') {
            resourceData.campus = campus;
            resourceData.faculty = faculty;
            resourceData.department = department;
        }
        
        console.log("📝 Resource data to insert:", resourceData);
        
        // Try to insert data
        let resource;
        try {
            const { data, error: insertError } = await supabase
                .from('resources')
                .insert(resourceData)
                .select()
                .single();
            
            if (insertError) {
                console.error("❌ Insert error:", insertError);
                
                // Check if error is about missing campus column
                if (insertError.message && insertError.message.includes('campus')) {
                    console.log("⚠️ Campus column might not exist, trying without university fields...");
                    
                    // Remove university fields and try again
                    delete resourceData.campus;
                    delete resourceData.faculty;
                    delete resourceData.department;
                    
                    const { data: data2, error: insertError2 } = await supabase
                        .from('resources')
                        .insert(resourceData)
                        .select()
                        .single();
                    
                    if (insertError2) {
                        console.error("❌ Second insert error:", insertError2);
                        throw insertError2;
                    }
                    
                    resource = data2;
                    console.log("✅ Resource created without university fields:", resource.id);
                    
                    // Show warning to user
                    showNotification(
                        currentLang === 'en' 
                            ? 'Resource uploaded, but university details were not saved (database needs update)' 
                            : 'සම්පත් උඩුගත කළා, නමුත් විශ්වවිද්‍යාලයේ විස්තර සුරැකුම් කර නැත (දත්ත ගබඩාව යාවත්කාලීන කළ යුතුය)',
                        'error'
                    );
                } else {
                    throw insertError;
                }
            } else {
                resource = data;
                console.log("✅ Resource created with all fields:", resource.id);
            }
        } catch (insertError) {
            console.error("❌ Failed to insert resource:", insertError);
            throw insertError;
        }
        
        console.log("✅ Resource created:", resource.id);
        showUploadProgress(50);
        
        // 2. Upload file to storage (with progress tracking)
        const filePath = `${resource.id}/${cleanName}`;
        showUploadProgress(60);
        
        const { error: uploadError } = await supabase.storage
            .from('resources')
            .upload(filePath, file, {
                cacheControl: '3600',
                onUploadProgress: (progress) => {
                    const percent = 60 + Math.floor((progress.loaded / progress.total) * 30);
                    showUploadProgress(percent);
                }
            });
        
        if (uploadError) throw uploadError;
        
        showUploadProgress(90);
        
        // 3. Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('resources')
            .getPublicUrl(filePath);
        
        // 4. Update resource with download URL
        const { error: updateError } = await supabase
            .from('resources')
            .update({ download_url: publicUrl })
            .eq('id', resource.id);
        
        if (updateError) throw updateError;
        
        showUploadProgress(100);
        
        // Success!
        showNotification(
            currentLang === 'en' 
                ? 'Upload successful!' 
                : 'උඩුගත කිරීම සාර්ථකයි!', 
            'success'
        );
        
        // Wait a moment to show completion
        setTimeout(() => {
            closeModal();
            hideUploadProgress();
            
            // Reload resources
            loadResources();
        }, 1000);
        
    } catch (error) {
        console.error("❌ Upload error:", error);
        showNotification(
            currentLang === 'en' 
                ? 'Upload failed: ' + error.message 
                : 'උඩුගත කිරීම අසාර්ථක විය: ' + error.message, 
            'error'
        );
        hideUploadProgress();
    } finally {
        // Reset button
        elements.submitUpload.innerHTML = '<i class="fas fa-upload"></i> Upload';
        elements.submitUpload.disabled = false;
    }
}

// Handle download
async function handleDownload(resource) {
    try {
        console.log("📥 Downloading:", resource.name);
        
        if (!resource.download_url) {
            showNotification('Download URL not found', 'error');
            return;
        }
        
        // Open download link
        const link = document.createElement('a');
        link.href = resource.download_url;
        link.target = '_blank';
        link.download = resource.original_name || resource.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Update download count
        const { error } = await supabase
            .from('resources')
            .update({
                download_count: (resource.download_count || 0) + 1,
                last_downloaded: new Date().toISOString()
            })
            .eq('id', resource.id);
        
        if (error) {
            console.error("❌ Failed to update download count:", error);
        }
        
        showNotification('Download started!', 'success');
        
        // Refresh resources to update count
        await loadResources();
        
    } catch (error) {
        console.error("❌ Download error:", error);
        showNotification('Download failed', 'error');
    }
}

// Handle report
async function handleReport(resource) {
    try {
        const { error } = await supabase
            .from('flagged')
            .insert({
                resource_id: resource.id,
                resource_name: resource.name,
                grade: resource.grade,
                description: 'Reported by user',
                status: 'pending'
            });
        
        if (error) throw error;
        
        showNotification('Resource reported for review', 'success');
        
    } catch (error) {
        console.error("❌ Report error:", error);
        showNotification('Failed to report resource', 'error');
    }
}

// Upload progress functions
function showUploadProgress(percent) {
    let progressBar = document.getElementById('upload-progress-bar');
    let progressText = document.getElementById('upload-progress-text');
    
    if (!progressBar) {
        // Create progress bar if it doesn't exist
        const progressDiv = document.createElement('div');
        progressDiv.id = 'upload-progress';
        progressDiv.style.cssText = `
            margin: 15px 0;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 5px;
            display: block;
        `;
        
        progressBar = document.createElement('div');
        progressBar.id = 'upload-progress-bar';
        progressBar.style.cssText = `
            width: ${percent}%;
            height: 10px;
            background: #4361ee;
            border-radius: 5px;
            transition: width 0.3s;
        `;
        
        progressText = document.createElement('div');
        progressText.id = 'upload-progress-text';
        progressText.style.cssText = `
            margin-top: 5px;
            font-size: 12px;
            color: #666;
            text-align: center;
        `;
        progressText.textContent = `${percent}%`;
        
        progressDiv.appendChild(progressBar);
        progressDiv.appendChild(progressText);
        
        const modalBody = document.querySelector('.modal-body');
        const formGroups = modalBody.querySelectorAll('.form-group');
        if (formGroups.length > 0) {
            modalBody.insertBefore(progressDiv, formGroups[formGroups.length - 1].nextSibling);
        }
    } else {
        progressBar.style.width = `${percent}%`;
        progressText.textContent = `${percent}%`;
    }
}

function hideUploadProgress() {
    const progressDiv = document.getElementById('upload-progress');
    if (progressDiv) {
        progressDiv.style.display = 'none';
    }
}

// Helper functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
    return size + ' ' + sizes[i];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        'pdf': 'file-pdf',
        'doc': 'file-word',
        'docx': 'file-word',
        'jpg': 'file-image',
        'jpeg': 'file-image',
        'png': 'file-image',
        'mp4': 'file-video',
        'mp3': 'file-audio',
        'zip': 'file-archive',
        'rar': 'file-archive'
    };
    return icons[ext] || 'file';
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container') || createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
    `;
    document.body.appendChild(container);
    return container;
}

function updateResultsCount(count) {
    if (elements.resultsCount) {
        elements.resultsCount.textContent = 
            currentLang === 'en' 
                ? `${count} resources found`
                : `${count} සම්පත් හමු විය`;
    }
}

// Language functions
function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'si' : 'en';
    localStorage.setItem('lang', currentLang);
    applyLanguage();
}

function applyLanguage() {
    // Update UI text
    const texts = {
        'en': {
            siteTitle: 'Notes for Flood Relief',
            mission: 'A free platform to share study materials for students affected by floods in Sri Lanka',
            uploadText: 'Upload Notes',
            searchPlaceholder: 'Search resources...',
            resourcesTitle: 'Available Resources',
            langText: 'සිංහල',
            modalTitle: 'Upload Notes',
            download: 'Download',
            cancel: 'Cancel',
            fileSizeLimit: 'PDF, DOC, JPG, PNG (Max 1 GB)',
            gradeLabel: 'Grade Level *',
            campusLabel: 'Campus *',
            facultyLabel: 'Faculty *',
            departmentLabel: 'Department *',
            descriptionLabel: 'Description *',
            universityPlaceholders: {
                campus: 'e.g., University of Colombo',
                faculty: 'e.g., Faculty of Science',
                department: 'e.g., Department of Computer Science'
            }
        },
        'si': {
            siteTitle: 'දිවුලන්ට සොයාගන්න අධ්යාපන සටහන්',
            mission: 'ශ්‍රී ලංකාවේ වාරිණීකරණයෙන් බලපැවැත්වූ ශිෂ්‍යයින් සඳහා අධ්‍යාපන ද්‍රව්‍ය නොමිලේ බෙදාහරින වේදිකාවකි',
            uploadText: 'සටහන් උඩුගත කරන්න',
            searchPlaceholder: 'සම්පත් සොයන්න...',
            resourcesTitle: 'ලබා ගත හැකි සම්පත්',
            langText: 'English',
            modalTitle: 'සටහන් උඩුගත කරන්න',
            download: 'බාගන්න',
            cancel: 'අවලංගු කරන්න',
            fileSizeLimit: 'PDF, DOC, JPG, PNG (උපරිම 1 GB)',
            gradeLabel: 'ශ්‍රේණි මට්ටම *',
            campusLabel: 'විශ්ව විද්‍යාලය *',
            facultyLabel: 'පීඨය *',
            departmentLabel: 'විධාන පීඨය *',
            descriptionLabel: 'විස්තරය *',
            universityPlaceholders: {
                campus: 'උදා: කොළඹ විශ්වවිද්‍යාලය',
                faculty: 'උදා: විද්‍යා පීඨය',
                department: 'උදා: පරිගණක විද්‍යා විධාන පීඨය'
            }
        }
    };
    
    const t = texts[currentLang];
    
    // Update elements
    if (document.getElementById('site-title')) document.getElementById('site-title').textContent = t.siteTitle;
    if (document.getElementById('mission')) document.getElementById('mission').textContent = t.mission;
    if (document.getElementById('upload-text')) document.getElementById('upload-text').textContent = t.uploadText;
    if (document.getElementById('search')) document.getElementById('search').placeholder = t.searchPlaceholder;
    if (document.getElementById('resources-title')) document.getElementById('resources-title').textContent = t.resourcesTitle;
    if (document.querySelector('.lang-text')) document.querySelector('.lang-text').textContent = t.langText;
    if (document.getElementById('modal-title')) document.getElementById('modal-title').textContent = t.modalTitle;
    if (document.getElementById('cancel-upload')) document.getElementById('cancel-upload').textContent = t.cancel;
    
    // Update upload area text
    if (document.getElementById('upload-size-text')) document.getElementById('upload-size-text').textContent = t.fileSizeLimit;
    
    // Update modal labels
    if (document.getElementById('grade-label')) document.getElementById('grade-label').textContent = t.gradeLabel;
    if (document.getElementById('campus-label')) document.getElementById('campus-label').textContent = t.campusLabel;
    if (document.getElementById('faculty-label')) document.getElementById('faculty-label').textContent = t.facultyLabel;
    if (document.getElementById('department-label')) document.getElementById('department-label').textContent = t.departmentLabel;
    if (document.getElementById('description-label')) document.getElementById('description-label').textContent = t.descriptionLabel;
    
    // Update university placeholders
    if (document.getElementById('modal-campus')) document.getElementById('modal-campus').placeholder = t.universityPlaceholders.campus;
    if (document.getElementById('modal-faculty')) document.getElementById('modal-faculty').placeholder = t.universityPlaceholders.faculty;
    if (document.getElementById('modal-department')) document.getElementById('modal-department').placeholder = t.universityPlaceholders.department;
    
    // Update download buttons
    document.querySelectorAll('.download-btn').forEach(btn => {
        if (btn.querySelector('i')) {
            btn.innerHTML = `<i class="fas fa-download"></i> ${t.download}`;
        }
    });
    
    // Update results count
    if (resources.length > 0) {
        updateResultsCount(resources.length);
    }
}