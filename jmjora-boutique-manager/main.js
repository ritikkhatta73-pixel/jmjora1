class BoutiqueManager {
    constructor() {
        this.orders = JSON.parse(localStorage.getItem('jmjora_orders')) || [];
        this.products = JSON.parse(localStorage.getItem('jmjora_products')) || [
            { id: 1, name: "Regal Velvet Suit", price: 550, image: "https://images.unsplash.com/photo-1595777457583-95e059f581ce?w=500&q=80" },
            { id: 2, name: "Golden Zari Lehenga", price: 1200, image: "https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=500&q=80" },
            { id: 3, name: "Embroidered Silk Kurti", price: 300, image: "https://images.unsplash.com/photo-1583391733958-650fac5fea0c?w=500&q=80" }
        ];
        this.currentView = 'dashboard';
        this.editingOrderId = null;

        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupForms();
        this.setupFilters();
        
        // Initial Renders
        this.renderDashboard();
        this.renderOrders();
        this.renderCatalog();
    }

    // --- Navigation & Modals ---

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');

                const targetId = item.getAttribute('data-target');
                document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
                document.getElementById(targetId).classList.add('active');
                
                this.currentView = targetId;
                if (targetId === 'dashboard') this.renderDashboard();
            });
        });
    }

    openModal(modalId, orderId = null) {
        document.getElementById(modalId).style.display = 'block';
        
        if (modalId === 'orderModal') {
            const form = document.getElementById('orderForm');
            const title = document.getElementById('orderModalTitle');
            
            if (orderId) {
                const order = this.orders.find(o => o.id === orderId);
                title.textContent = 'Edit Order';
                this.editingOrderId = orderId;
                
                document.getElementById('customerName').value = order.customerName;
                document.getElementById('customerPhone').value = order.customerPhone;
                document.getElementById('outfitType').value = order.outfitType;
                document.getElementById('orderDate').value = order.orderDate;
                document.getElementById('deliveryDate').value = order.deliveryDate;
                document.getElementById('orderStatus').value = order.status;
            } else {
                title.textContent = 'Add New Order';
                this.editingOrderId = null;
                form.reset();
                document.getElementById('orderDate').value = new Date().toISOString().split('T')[0];
            }
        }
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
        if (modalId === 'orderModal') document.getElementById('orderForm').reset();
        if (modalId === 'productModal') document.getElementById('productForm').reset();
    }

    // --- State Management ---

    saveOrders() {
        localStorage.setItem('jmjora_orders', JSON.stringify(this.orders));
        this.renderDashboard();
        this.renderOrders();
    }

    saveProducts() {
        localStorage.setItem('jmjora_products', JSON.stringify(this.products));
        this.renderCatalog();
    }

    // --- Dashboard ---

    renderDashboard() {
        const total = this.orders.length;
        const pending = this.orders.filter(o => o.status === 'Pending').length;
        const inProgress = this.orders.filter(o => o.status === 'In Progress').length;
        const completed = this.orders.filter(o => o.status === 'Completed').length;

        document.getElementById('metric-total').textContent = total;
        document.getElementById('metric-pending').textContent = pending;
        document.getElementById('metric-progress').textContent = inProgress;
        document.getElementById('metric-completed').textContent = completed;

        const recentTbody = document.querySelector('#recent-orders-table tbody');
        recentTbody.innerHTML = '';
        
        const recentOrders = [...this.orders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)).slice(0, 5);
        
        if (recentOrders.length === 0) {
            recentTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);padding:2rem;">No orders yet.</td></tr>';
            return;
        }

        recentOrders.forEach(order => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${order.customerName}</strong></td>
                <td>${order.outfitType}</td>
                <td>${this.formatDate(order.orderDate)}</td>
                <td><span class="badge ${order.status.toLowerCase().replace(' ', '-')}">${order.status}</span></td>
            `;
            recentTbody.appendChild(tr);
        });
    }

    // --- Orders ---

    setupForms() {
        document.getElementById('orderForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const newOrder = {
                id: this.editingOrderId || Date.now().toString(),
                customerName: document.getElementById('customerName').value,
                customerPhone: document.getElementById('customerPhone').value,
                outfitType: document.getElementById('outfitType').value,
                orderDate: document.getElementById('orderDate').value,
                deliveryDate: document.getElementById('deliveryDate').value,
                status: document.getElementById('orderStatus').value
            };

            if (this.editingOrderId) {
                const idx = this.orders.findIndex(o => o.id === this.editingOrderId);
                this.orders[idx] = newOrder;
                this.showToast('Order updated successfully!');
            } else {
                this.orders.push(newOrder);
                this.showToast('Order created successfully!');
            }

            this.saveOrders();
            this.closeModal('orderModal');
        });

        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            let imageUrl = document.getElementById('productImage').value.trim();
            if (!imageUrl) {
                imageUrl = "https://images.unsplash.com/photo-1542295669297-4d352b042bce?w=500&q=80"; // A nice placeholder generic item
            }

            const newProduct = {
                id: Date.now().toString(),
                name: document.getElementById('productName').value,
                price: parseFloat(document.getElementById('productPrice').value),
                image: imageUrl
            };

            this.products.push(newProduct);
            this.saveProducts();
            this.closeModal('productModal');
            this.showToast('Product added to catalog!');
        });

        window.onclick = (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = "none";
            }
        };
    }

    setupFilters() {
        document.getElementById('order-search').addEventListener('input', () => this.renderOrders());
        document.getElementById('status-filter').addEventListener('change', () => this.renderOrders());
    }

    renderOrders() {
        const tbody = document.querySelector('#orders-table tbody');
        const searchTerm = document.getElementById('order-search').value.toLowerCase();
        const statusFilter = document.getElementById('status-filter').value;
        
        tbody.innerHTML = '';

        const filteredOrders = this.orders.filter(order => {
            const matchesSearch = order.customerName.toLowerCase().includes(searchTerm) || 
                                  order.customerPhone.includes(searchTerm);
            const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
            return matchesSearch && matchesStatus;
        });

        if (filteredOrders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-secondary);padding:2rem;">No matching orders.</td></tr>';
            return;
        }

        filteredOrders.forEach(order => {
            const tr = document.createElement('tr');
            
            const shortId = order.id.toString().slice(-4);
            // Format phone number to numbers only, stripping +, -, spaces etc
            const phoneClean = order.customerPhone.replace(/\D/g, ''); 
            // Only add default country code if length implies it's missing (optional, simplistic)
            const waNumber = phoneClean.length <= 10 ? `1${phoneClean}` : phoneClean;
            
            const waMsg = encodeURIComponent(`Hello ${order.customerName},\nThis is JMJORA Boutique regarding your ${order.outfitType} order.\nStatus: ${order.status}.\nDelivery Date: ${this.formatDate(order.deliveryDate)}.`);
            const waLink = `https://wa.me/${waNumber}?text=${waMsg}`;

            tr.innerHTML = `
                <td>#${shortId}</td>
                <td><strong>${order.customerName}</strong></td>
                <td>${order.customerPhone}</td>
                <td>${order.outfitType}</td>
                <td>${this.formatDate(order.deliveryDate)}</td>
                <td><span class="badge ${order.status.toLowerCase().replace(' ', '-')}">${order.status}</span></td>
                <td>
                    <button class="btn-icon whatsapp" onclick="window.open('${waLink}', '_blank')" title="WhatsApp Customer"><i class="fab fa-whatsapp"></i></button>
                    <button class="btn-icon edit" onclick="app.openModal('orderModal', '${order.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete" onclick="app.deleteOrder('${order.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    deleteOrder(id) {
        if(confirm('Are you sure you want to delete this order?')) {
            this.orders = this.orders.filter(o => o.id !== id);
            this.saveOrders();
            this.showToast('Order deleted.');
        }
    }

    // --- Catalog ---

    renderCatalog() {
        const grid = document.getElementById('catalog-grid');
        grid.innerHTML = '';

        if (this.products.length === 0) {
            grid.innerHTML = '<p style="color:var(--text-secondary);grid-column:1/-1;text-align:center;">No products in catalog yet.</p>';
            return;
        }

        this.products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://images.unsplash.com/photo-1542295669297-4d352b042bce?w=500&q=80'">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">$${product.price.toFixed(2)}</p>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // --- Utils ---

    formatDate(dateStr) {
        if (!dateStr) return '';
        // handle yyyy-mm-dd
        const params = dateStr.split('-');
        if(params.length === 3) {
            const date = new Date(params[0], params[1] - 1, params[2]);
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return date.toLocaleDateString(undefined, options);
        }
        return dateStr;
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

// Initialize App
const app = new BoutiqueManager();
