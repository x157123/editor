import type { Editor } from '@tiptap/core'
import type { Comment, CommentAuthor, CommentReply } from '@/types'
import { shortId } from '@/utils/short-id'

export function useComment(editor: any, currentUser: CommentAuthor) {
  const comments = ref<Map<string, Comment>>(new Map())
  const activeCommentId = ref<string | null>(null)
  const currentUserRef = ref<CommentAuthor>(currentUser)

  // 添加批注
  const addComment = (content: string, commentId?: string) => {
    const id = commentId || shortId()
    const now = Date.now()

    const comment: Comment = {
      id,
      content,
      author: currentUserRef.value,
      createdAt: now,
      resolved: false,
      replies: [],
    }

    comments.value.set(id, comment)
    return id
  }

  // 更新批注内容
  const updateComment = (commentId: string, content: string) => {
    const comment = comments.value.get(commentId)
    if (comment) {
      comment.content = content
      comment.updatedAt = Date.now()
      comments.value.set(commentId, comment)
    }
  }

  // 删除批注
  const deleteComment = (commentId: string) => {
    if (editor.value) {
      editor.value.commands.deleteComment(commentId)
    }
    comments.value.delete(commentId)
    if (activeCommentId.value === commentId) {
      activeCommentId.value = null
    }
  }

  // 解决批注
  const resolveComment = (commentId: string) => {
    const comment = comments.value.get(commentId)
    if (comment) {
      comment.resolved = true
      comments.value.set(commentId, comment)
    }
  }

  // 重新打开批注
  const reopenComment = (commentId: string) => {
    const comment = comments.value.get(commentId)
    if (comment) {
      comment.resolved = false
      comments.value.set(commentId, comment)
    }
  }

  // 添加回复
  const addReply = (commentId: string, content: string) => {
    const comment = comments.value.get(commentId)
    if (comment) {
      const reply: CommentReply = {
        id: shortId(),
        content,
        author: currentUserRef.value,
        createdAt: Date.now(),
      }
      comment.replies.push(reply)
      comments.value.set(commentId, comment)
    }
  }

  // 删除回复
  const deleteReply = (commentId: string, replyId: string) => {
    const comment = comments.value.get(commentId)
    if (comment) {
      comment.replies = comment.replies.filter((reply) => reply.id !== replyId)
      comments.value.set(commentId, comment)
    }
  }

  // 设置活动批注
  const setActiveComment = (commentId: string | null) => {
    activeCommentId.value = commentId
    if (commentId && editor.value) {
      editor.value.commands.focusComment(commentId)
    }
  }

  // 获取所有批注
  const getAllComments = (): Comment[] => {
    return Array.from(comments.value.values())
  }

  // 获取未解决的批注
  const getUnresolvedComments = (): Comment[] => {
    return getAllComments().filter((comment: Comment) => !comment.resolved)
  }

  // 获取已解决的批注
  const getResolvedComments = (): Comment[] => {
    return getAllComments().filter((comment: Comment) => comment.resolved)
  }

  // 批注数量统计
  const commentCount = computed(() => comments.value.size)
  const unresolvedCount = computed(() => getUnresolvedComments().length)
  const resolvedCount = computed(() => getResolvedComments().length)

  // 从编辑器同步批注标记
  const syncCommentsFromEditor = () => {
    if (!editor.value) return

    const editorComments = editor.value.commands.getAllComments()
    // 这里可以根据需要进行进一步的同步逻辑
  }

  // 设置当前用户
  const setCurrentUser = (user: CommentAuthor) => {
    currentUserRef.value = user
  }

  // 导出批注数据
  const exportComments = () => {
    const commentArray = getAllComments()
    return JSON.stringify(commentArray, null, 2)
  }

  // 导入批注数据
  const importComments = (data: string) => {
    try {
      const commentArray: Comment[] = JSON.parse(data)
      comments.value.clear()
      commentArray.forEach((comment) => {
        comments.value.set(comment.id, comment)
      })
    } catch (error) {
      console.error('导入批注失败:', error)
    }
  }

  return {
    comments,
    activeCommentId,
    currentUser: currentUserRef,
    addComment,
    updateComment,
    deleteComment,
    resolveComment,
    reopenComment,
    addReply,
    deleteReply,
    setActiveComment,
    getAllComments,
    getUnresolvedComments,
    getResolvedComments,
    commentCount,
    unresolvedCount,
    resolvedCount,
    syncCommentsFromEditor,
    setCurrentUser,
    exportComments,
    importComments,
  }
}
