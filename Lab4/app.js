"use strict";
class TodoApp {
    constructor() {
        this.todos = [];
        this.filter = 'all';
        this.editingId = null;
        this.storageKey = 'lab4_todos';
        this.input = document.getElementById('todo-input');
        this.list = document.getElementById('todo-list');
        this.itemsLeft = document.getElementById('items-left');
        this.clearCompletedBtn = document.getElementById('clear-completed-btn');
        this.clearAllBtn = document.getElementById('clear-all-btn');
        this.load();
        this.bindEvents();
        this.render();
    }
    load() {
        const raw = localStorage.getItem(this.storageKey);
        this.todos = raw ? JSON.parse(raw) : [
            { id: '1', text: 'See Lecture', completed: false },
            { id: '2', text: 'Solve assignment', completed: false }
        ];
    }
    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.todos));
    }
    get filtered() {
        if (this.filter === 'active')
            return this.todos.filter(t => !t.completed);
        if (this.filter === 'completed')
            return this.todos.filter(t => t.completed);
        return [...this.todos];
    }
    render() {
        const activeCount = this.todos.filter(t => !t.completed).length;
        const completedCount = this.todos.length - activeCount;
        this.itemsLeft.textContent = `${activeCount} item${activeCount === 1 ? '' : 's'} left`;
        this.clearCompletedBtn.disabled = completedCount === 0;
        this.clearAllBtn.disabled = this.todos.length === 0;
        if (this.filtered.length === 0) {
            this.list.innerHTML = '<li class="todo-empty">No tasks</li>';
            return;
        }
        this.list.innerHTML = this.filtered.map(({ id, text, completed }) => `
            <li class="todo-item${completed ? ' completed' : ''}${this.editingId === id ? ' editing' : ''}" data-id="${id}">
                <div class="todo-view">
                    <label class="todo-checkbox-container">
                        <input type="checkbox" class="todo-checkbox" ${completed ? 'checked' : ''}>
                        <span class="custom-checkbox">
                            <svg viewBox="0 0 12 10"><polyline points="1.5 5 4.5 8 10.5 2"></polyline></svg>
                        </span>
                    </label>
                    <span class="todo-text">${text}</span>
                    <button type="button" class="btn-delete" title="Delete todo">
                        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
                <input type="text" class="todo-edit-input" value="${text}">
            </li>
        `).join('');
        if (this.editingId) {
            const editInput = this.list.querySelector(`.todo-item[data-id="${this.editingId}"] .todo-edit-input`);
            if (editInput) {
                editInput.focus();
                editInput.select();
            }
        }
    }
    bindEvents() {
        document.getElementById('todo-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const val = this.input.value.trim();
            if (val) {
                this.todos.push({ id: Date.now().toString(), text: val, completed: false });
                this.input.value = '';
                this.save();
                this.render();
            }
        });
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.filter = btn.getAttribute('data-filter') || 'all';
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));
                this.render();
            });
        });
        this.clearCompletedBtn.addEventListener('click', () => {
            this.todos = this.todos.filter(t => !t.completed);
            this.save();
            this.render();
        });
        this.clearAllBtn.addEventListener('click', () => {
            this.todos = [];
            this.save();
            this.render();
        });
        this.list.addEventListener('change', (e) => {
            const target = e.target;
            const item = target.closest('.todo-item');
            if (item?.dataset.id) {
                const todo = this.todos.find(t => t.id === item.dataset.id);
                if (todo) {
                    todo.completed = target.checked;
                    this.save();
                    this.render();
                }
            }
        });
        this.list.addEventListener('click', (e) => {
            const target = e.target;
            const delBtn = target.closest('.btn-delete');
            const item = target.closest('.todo-item');
            if (delBtn && item?.dataset.id) {
                this.todos = this.todos.filter(t => t.id !== item.dataset.id);
                this.save();
                this.render();
            }
        });
        this.list.addEventListener('dblclick', (e) => {
            const target = e.target;
            if (target.classList.contains('todo-text')) {
                const item = target.closest('.todo-item');
                if (item?.dataset.id) {
                    this.editingId = item.dataset.id;
                    this.render();
                }
            }
        });
        const commitEdit = (input) => {
            const item = input.closest('.todo-item');
            if (item?.dataset.id && this.editingId === item.dataset.id) {
                const val = input.value.trim();
                if (val) {
                    const todo = this.todos.find(t => t.id === item.dataset.id);
                    if (todo)
                        todo.text = val;
                }
                else {
                    this.todos = this.todos.filter(t => t.id !== item.dataset.id);
                }
                this.editingId = null;
                this.save();
                this.render();
            }
        };
        this.list.addEventListener('keydown', (e) => {
            const input = e.target;
            if (input.classList.contains('todo-edit-input')) {
                if (e.key === 'Enter') {
                    commitEdit(input);
                }
                else if (e.key === 'Escape') {
                    this.editingId = null;
                    this.render();
                }
            }
        });
        this.list.addEventListener('focusout', (e) => {
            const input = e.target;
            if (input.classList.contains('todo-edit-input')) {
                commitEdit(input);
            }
        });
    }
}
new TodoApp();
