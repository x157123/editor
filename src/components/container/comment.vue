<template>
  <div class="umo-comment-container">
    <div class="umo-comment-header">
      <div class="umo-comment-title">
        <icon class="icon-comment" name="comment" />
        {{ t('comment.title') }}
      </div>
      <div class="umo-comment-actions">
        <div class="umo-dialog__close" @click="commentPanel = false">
          <icon name="close" />
        </div>
      </div>
    </div>

    <div class="umo-comment-tabs">
      <div
        class="umo-comment-tab"
        :class="{ active: activeTab === 'unresolved' }"
        @click="activeTab = 'unresolved'"
      >
        {{ t('comment.unresolved') }}
        <span class="umo-comment-count">{{ commentState.unresolvedCount }}</span>
      </div>
      <div
        class="umo-comment-tab"
        :class="{ active: activeTab === 'resolved' }"
        @click="activeTab = 'resolved'"
      >
        {{ t('comment.resolved') }}
        <span class="umo-comment-count">{{ commentState.resolvedCount }}</span>
      </div>
    </div>

    <div class="umo-comment-content umo-scrollbar">
      <div v-if="displayComments.length === 0" class="umo-comment-empty">
        {{ t('comment.empty') }}
      </div>

      <div
        v-for="comment in displayComments"
        :key="comment.id"
        class="umo-comment-item"
        :class="{ active: commentState.activeCommentId === comment.id }"
        @click="setActiveComment(comment.id)"
      >
        <div class="umo-comment-item-header">
          <div class="umo-comment-author">
            <img
              v-if="comment.author.avatar"
              :src="comment.author.avatar"
              class="umo-comment-avatar"
              :alt="comment.author.name"
            />
            <div v-else class="umo-comment-avatar-placeholder">
              {{ comment.author.name.charAt(0).toUpperCase() }}
            </div>
            <div class="umo-comment-author-info">
              <div class="umo-comment-author-name">{{ comment.author.name }}</div>
              <div class="umo-comment-time">{{ formatTime(comment.createdAt) }}</div>
            </div>
          </div>
          <div class="umo-comment-item-actions">
            <t-dropdown :options="getCommentActions(comment)">
              <icon name="more" class="umo-comment-more" />
            </t-dropdown>
          </div>
        </div>

        <div class="umo-comment-item-content">
          <div v-if="editingCommentId === comment.id" class="umo-comment-edit">
            <t-textarea
              v-model="editContent"
              :autosize="{ minRows: 2, maxRows: 6 }"
              :placeholder="t('comment.editPlaceholder')"
            />
            <div class="umo-comment-edit-actions">
              <t-button size="small" variant="outline" @click="cancelEdit">
                {{ t('comment.cancel') }}
              </t-button>
              <t-button size="small" @click="saveEdit(comment.id)">
                {{ t('comment.save') }}
              </t-button>
            </div>
          </div>
          <div v-else class="umo-comment-text">{{ comment.content }}</div>
        </div>

        <!-- 回复列表 -->
        <div v-if="comment.replies.length > 0" class="umo-comment-replies">
          <div
            v-for="reply in comment.replies"
            :key="reply.id"
            class="umo-comment-reply"
          >
            <div class="umo-comment-author">
              <img
                v-if="reply.author.avatar"
                :src="reply.author.avatar"
                class="umo-comment-avatar small"
                :alt="reply.author.name"
              />
              <div v-else class="umo-comment-avatar-placeholder small">
                {{ reply.author.name.charAt(0).toUpperCase() }}
              </div>
              <div class="umo-comment-author-info">
                <div class="umo-comment-author-name">{{ reply.author.name }}</div>
                <div class="umo-comment-time">{{ formatTime(reply.createdAt) }}</div>
              </div>
            </div>
            <div class="umo-comment-text">{{ reply.content }}</div>
          </div>
        </div>

        <!-- 回复输入框 -->
        <div v-if="replyingCommentId === comment.id" class="umo-comment-reply-input">
          <t-textarea
            v-model="replyContent"
            :autosize="{ minRows: 2, maxRows: 4 }"
            :placeholder="t('comment.replyPlaceholder')"
          />
          <div class="umo-comment-reply-actions">
            <t-button size="small" variant="outline" @click="cancelReply">
              {{ t('comment.cancel') }}
            </t-button>
            <t-button size="small" @click="submitReply(comment.id)">
              {{ t('comment.reply') }}
            </t-button>
          </div>
        </div>
      </div>
    </div>

    <div class="umo-comment-resize-handle" @mousedown="startResize"></div>
  </div>
</template>

<script setup lang="ts">
import type { Comment } from '@/types'
import { useComment } from '@/composables/comment'

const container = inject('container')
const editor = inject('editor')
const commentPanel = inject('commentPanel')
const options = inject('options')

// 获取当前用户，如果未配置则使用默认用户
const getCurrentUser = () => {
  return options.value.comment?.currentUser || {
    id: 'default-user',
    name: t('comment.defaultUser'),
  }
}

// 初始化批注状态
const commentState = useComment(editor, getCurrentUser())

const activeTab = ref<'unresolved' | 'resolved'>('unresolved')
const editingCommentId = ref<string | null>(null)
const editContent = ref('')
const replyingCommentId = ref<string | null>(null)
const replyContent = ref('')

const displayComments = computed(() => {
  if (activeTab.value === 'unresolved') {
    return commentState.getUnresolvedComments()
  }
  return commentState.getResolvedComments()
})

const setActiveComment = (commentId: string) => {
  commentState.setActiveComment(commentId)
}

const getCommentActions = (comment: Comment) => {
  const actions = [
    {
      content: t('comment.reply'),
      onClick: () => startReply(comment.id),
    },
    {
      content: t('comment.edit'),
      onClick: () => startEdit(comment.id, comment.content),
    },
  ]

  if (comment.resolved) {
    actions.push({
      content: t('comment.reopen'),
      onClick: () => commentState.reopenComment(comment.id),
    })
  } else {
    actions.push({
      content: t('comment.resolve'),
      onClick: () => commentState.resolveComment(comment.id),
    })
  }

  actions.push({
    content: t('comment.delete'),
    onClick: () => commentState.deleteComment(comment.id),
  })

  return actions
}

const startEdit = (commentId: string, content: string) => {
  editingCommentId.value = commentId
  editContent.value = content
}

const cancelEdit = () => {
  editingCommentId.value = null
  editContent.value = ''
}

const saveEdit = (commentId: string) => {
  if (editContent.value.trim()) {
    commentState.updateComment(commentId, editContent.value)
    cancelEdit()
  }
}

const startReply = (commentId: string) => {
  replyingCommentId.value = commentId
  replyContent.value = ''
}

const cancelReply = () => {
  replyingCommentId.value = null
  replyContent.value = ''
}

const submitReply = (commentId: string) => {
  if (replyContent.value.trim()) {
    commentState.addReply(commentId, replyContent.value)
    cancelReply()
  }
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) {
    return t('comment.justNow')
  } else if (diff < 3600000) {
    return t('comment.minutesAgo', { minutes: Math.floor(diff / 60000) })
  } else if (diff < 86400000) {
    return t('comment.hoursAgo', { hours: Math.floor(diff / 3600000) })
  } else if (diff < 604800000) {
    return t('comment.daysAgo', { days: Math.floor(diff / 86400000) })
  } else {
    return date.toLocaleDateString()
  }
}

// 调整大小功能
const startResize = (e: MouseEvent) => {
  e.preventDefault()
  const startX = e.clientX
  const containerEl = container.value?.$el || container.value
  const commentContainer = containerEl.querySelector('.umo-comment-container')
  const startWidth = commentContainer.offsetWidth

  const onMouseMove = (moveEvent: MouseEvent) => {
    const deltaX = startX - moveEvent.clientX
    const newWidth = startWidth + deltaX
    if (newWidth >= 280 && newWidth <= 600) {
      commentContainer.style.width = `${newWidth}px`
    }
  }

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
</script>
