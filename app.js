// New Year Resolution Tracker App
class ResolutionTracker {
    constructor() {
        this.goals = this.loadGoals();
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.renderGoals();
        this.updateStats();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Form submission
        const form = document.getElementById('goalForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addGoal();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.renderGoals();
            });
        });
    }

    addGoal() {
        const input = document.getElementById('goalInput');
        const category = document.getElementById('categorySelect');
        
        const goal = {
            id: Date.now().toString(),
            text: input.value.trim(),
            category: category.value,
            categoryLabel: category.options[category.selectedIndex].text,
            progress: 0,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (goal.text) {
            this.goals.unshift(goal);
            this.saveGoals();
            this.renderGoals();
            this.updateStats();
            input.value = '';
            input.focus();
            
            // Show success animation
            this.showNotification('Resolution added! 🎉');
        }
    }

    updateProgress(goalId, increment = 10) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal && !goal.completed) {
            goal.progress = Math.min(100, goal.progress + increment);
            goal.updatedAt = new Date().toISOString();
            this.saveGoals();
            this.renderGoals();
            this.updateStats();
            
            if (goal.progress >= 100) {
                this.showNotification('Congratulations! Goal completed! 🎊');
            }
        }
    }

    toggleComplete(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            goal.completed = !goal.completed;
            if (goal.completed) {
                goal.progress = 100;
                this.showNotification('Great job! Goal marked as completed! ✨');
            } else {
                goal.progress = 0;
            }
            goal.updatedAt = new Date().toISOString();
            this.saveGoals();
            this.renderGoals();
            this.updateStats();
        }
    }

    deleteGoal(goalId) {
        if (confirm('Are you sure you want to delete this resolution?')) {
            this.goals = this.goals.filter(g => g.id !== goalId);
            this.saveGoals();
            this.renderGoals();
            this.updateStats();
            this.showNotification('Resolution removed');
        }
    }

    renderGoals() {
        const container = document.getElementById('goalsList');
        const emptyState = document.getElementById('emptyState');
        
        let filteredGoals = this.goals;
        
        if (this.currentFilter === 'active') {
            filteredGoals = this.goals.filter(g => !g.completed);
        } else if (this.currentFilter === 'completed') {
            filteredGoals = this.goals.filter(g => g.completed);
        }

        if (filteredGoals.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        container.innerHTML = filteredGoals.map(goal => this.createGoalCard(goal)).join('');
        
        // Attach event listeners to new elements
        container.querySelectorAll('.btn-progress').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const goalId = e.target.closest('.goal-card').dataset.goalId;
                this.updateProgress(goalId, 10);
            });
        });

        container.querySelectorAll('.btn-complete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const goalId = e.target.closest('.goal-card').dataset.goalId;
                this.toggleComplete(goalId);
            });
        });

        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const goalId = e.target.closest('.goal-card').dataset.goalId;
                this.deleteGoal(goalId);
            });
        });
    }

    createGoalCard(goal) {
        const daysSince = this.getDaysSince(goal.createdAt);
        const progressColor = goal.completed ? 'var(--success-color)' : 
                             goal.progress > 50 ? 'var(--primary-color)' : 
                             'var(--warning-color)';
        
        return `
            <div class="goal-card ${goal.completed ? 'completed' : ''}" data-goal-id="${goal.id}">
                <div class="goal-header">
                    <div>
                        <div class="goal-title">${this.escapeHtml(goal.text)}</div>
                        <span class="goal-category">${goal.categoryLabel}</span>
                    </div>
                    <div class="goal-actions">
                        ${!goal.completed ? `
                            <button class="btn-icon btn-progress" title="Add Progress">
                                ➕
                            </button>
                        ` : ''}
                        <button class="btn-icon complete btn-complete" title="${goal.completed ? 'Mark as Active' : 'Mark as Complete'}">
                            ${goal.completed ? '↩️' : '✅'}
                        </button>
                        <button class="btn-icon delete btn-delete" title="Delete">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="goal-progress">
                    <div class="progress-label">
                        <span>Progress</span>
                        <span>${Math.round(goal.progress)}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${goal.progress}%; background: ${progressColor};"></div>
                    </div>
                </div>
                <div class="goal-meta">
                    <div class="goal-date">
                        📅 Created ${daysSince === 0 ? 'today' : `${daysSince} day${daysSince === 1 ? '' : 's'} ago`}
                    </div>
                    ${goal.updatedAt !== goal.createdAt ? `
                        <div>Last updated: ${this.formatDate(goal.updatedAt)}</div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    updateStats() {
        const total = this.goals.length;
        const completed = this.goals.filter(g => g.completed).length;
        const inProgress = this.goals.filter(g => !g.completed && g.progress > 0).length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        document.getElementById('totalGoals').textContent = total;
        document.getElementById('completedGoals').textContent = completed;
        document.getElementById('inProgressGoals').textContent = inProgress;
        document.getElementById('completionRate').textContent = `${completionRate}%`;

        // Animate stat updates
        document.querySelectorAll('.stat-value').forEach(el => {
            el.style.transform = 'scale(1.1)';
            setTimeout(() => {
                el.style.transform = 'scale(1)';
            }, 200);
        });
    }

    getDaysSince(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    saveGoals() {
        localStorage.setItem('newYearResolutions', JSON.stringify(this.goals));
    }

    loadGoals() {
        const saved = localStorage.getItem('newYearResolutions');
        return saved ? JSON.parse(saved) : [];
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ResolutionTracker();
});

