// Cấu hình URL dựa trên dữ liệu thực tế của bạn
const BASE_URL = 'http://192.168.0.200/api1';
let allMovies = []; // Biến lưu trữ danh sách phim gốc để search không cần load lại API

// 1. Lấy danh sách phim từ Backend
async function fetchMovies() {
    const listElement = document.getElementById('movie-list');
    
    try {
        const response = await fetch(`${BASE_URL}/movies`);
        if (!response.ok) throw new Error('CORS hoặc Server lỗi');
        
        allMovies = await response.json();
        renderMovies(allMovies);
    } catch (error) {
        console.error('Lỗi kết nối API:', error);
        listElement.innerHTML = `
            <div class="col-span-full glass border-red-500/50 text-red-300 p-6 rounded-2xl text-center shadow-xl">
                <svg class="w-12 h-12 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                Không thể kết nối đến API. Hãy check lại Backend hoặc IP: ${BASE_URL}
            </div>`;
    }
}

// 2. Hiển thị danh sách phim (Xử lý Ảnh và Hiệu ứng Hover)
function renderMovies(movies) {
    const listElement = document.getElementById('movie-list');
    
    if (movies.length === 0) {
        listElement.innerHTML = `<p class="text-center col-span-full text-slate-600 text-xl py-20 animate-pulse">Không tìm thấy phim nào khớp với từ khóa...</p>`;
        return;
    }

    listElement.innerHTML = movies.map((movie, index) => {
        // Định dạng giá tiền VNĐ
        const formattedPrice = movie.price ? movie.price.toLocaleString('vi-VN') : '0';
        
        // Xử lý ảnh: Nếu imageUrl null thì dùng ảnh mặc định
        const movieImage = movie.imageUrl || 'https://via.placeholder.com/500x750?text=No+Poster';
        
        // Tạo delay load từng thẻ phim cho đẹp
        const animationDelay = index * 80; 

        return `
            <div class="movie-card glass rounded-3xl overflow-hidden group hover:border-cyan-500/50 hover:shadow-cyan-900/30 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                 style="animation-delay: ${animationDelay}ms;">
                
                <div class="relative h-80 overflow-hidden">
                    <img src="${movieImage}" 
                         class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                         alt="${movie.title}"
                         onerror="this.src='https://via.placeholder.com/500x750?text=Image+Error'">
                    <div class="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-transparent to-transparent opacity-90"></div>
                </div>

                <div class="p-6 relative -mt-24"> 
                    <h3 class="text-2xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-1 shadow-black drop-shadow-md">${movie.title}</h3>
                    
                    <div class="flex justify-between items-center mt-8">
                        <div class="flex flex-col">
                            <span class="text-[10px] uppercase tracking-tighter text-slate-400 font-bold">Giá vé hôm nay</span>
                            <span class="text-xl font-mono text-cyan-400 font-bold">${formattedPrice} <span class="text-xs font-sans text-slate-500">VNĐ</span></span>
                        </div>
                        <button onclick="openModal(${movie.id}, '${movie.title}', '${formattedPrice}')" 
                            class="bg-cyan-600/90 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl font-bold backdrop-blur-sm transition-all active:scale-95 shadow-lg flex items-center gap-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
                            Đặt vé
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 3. Logic Tìm kiếm Tức thì (Search Input)
function filterMovies() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const filtered = allMovies.filter(movie => 
        movie.title.toLowerCase().includes(searchTerm)
    );
    renderMovies(filtered);
}

// 4. Quản lý Modal (Mở/Đóng với Animation)
const modal = document.getElementById('booking-modal');
const modalContent = document.getElementById('modal-content');

function openModal(id, title, formattedPrice) {
    document.getElementById('selected-movie-id').value = id;
    document.getElementById('modal-movie-name').innerText = title;
    document.getElementById('modal-movie-price').innerText = `${formattedPrice} VNĐ`;
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
    }, 10);
    document.getElementById('user-id').focus();
}

function closeModal() {
    modal.classList.add('opacity-0');
    modalContent.classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

// 5. Gửi dữ liệu đặt vé (POST qua TicketController)
async function submitBooking() {
    const movieId = document.getElementById('selected-movie-id').value;
    const userId = document.getElementById('user-id').value;
    const btn = event.target; 

    if (!userId) {
        showToast('⚠️ Bạn chưa nhập User ID kìa!', 'warning');
        return;
    }

    btn.innerHTML = `<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>`;
    btn.disabled = true;

    try {
        const response = await fetch(`${BASE_URL}/tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                movie: { id: parseInt(movieId) },
                user: { id: parseInt(userId) }
            })
        });

        if (response.ok) {
            showToast('🎉 Đặt vé thành công! Quá ngon chim.', 'success');
            closeModal();
            document.getElementById('user-id').value = '';
        } else {
            showToast('❌ Lỗi! User ID này không có trong DB.', 'error');
        }
    } catch (error) {
        showToast('🌐 Không kết nối được server rồi ní ơi!', 'error');
    } finally {
        btn.innerHTML = 'Xác Nhận Đặt Vé Ngay';
        btn.disabled = false;
    }
}

// 6. Hệ thống Toast thông báo mượt mà
function showToast(message, type) {
    const toast = document.getElementById('toast');
    const borderColors = {
        success: 'border-cyan-500 text-cyan-400',
        error: 'border-red-500 text-red-400',
        warning: 'border-yellow-500 text-yellow-400'
    };
    toast.innerHTML = `<p class="font-bold tracking-wide">${message}</p>`;
    toast.className = `fixed bottom-6 right-6 glass p-5 rounded-2xl shadow-2xl z-[200] transition-all duration-300 border-l-8 ${borderColors[type]}`;
    
    // Hiện Toast
    toast.classList.remove('translate-y-20', 'opacity-0');
    // Tự ẩn sau 3 giây
    setTimeout(() => { toast.classList.add('translate-y-20', 'opacity-0'); }, 3000);
}

// Khởi động hệ thống
fetchMovies();
