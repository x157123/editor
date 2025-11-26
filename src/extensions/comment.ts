import { Mark, mergeAttributes } from '@tiptap/core'

export interface CommentOptions {
  /**
   * 批注样式类名
   * @default umo-comment
   */
  class: string
  /**
   * 批注ID
   */
  commentId: string | null
  /**
   * 批注点击回调
   */
  onCommentClick?: (commentId: string) => void
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    comment: {
      /**
       * 添加批注标记
       */
      setComment: (commentId: string) => ReturnType
      /**
       * 移除批注标记
       */
      unsetComment: (commentId?: string) => ReturnType
      /**
       * 获取所有批注
       */
      getAllComments: () => ReturnType
      /**
       * 定位到指定批注
       */
      focusComment: (commentId: string) => ReturnType
      /**
       * 删除指定批注标记
       */
      deleteComment: (commentId: string) => ReturnType
    }
  }
}

export default Mark.create<CommentOptions>({
  name: 'comment',
  priority: 1000,
  keepOnSplit: false,
  inclusive: false,

  addOptions() {
    return {
      class: 'umo-comment',
      commentId: null,
      onCommentClick: undefined,
    }
  },

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-comment-id'),
        renderHTML: (attributes) => {
          if (!attributes.commentId) {
            return {}
          }
          return {
            'data-comment-id': attributes.commentId,
            class: this.options.class,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment-id]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { class: this.options.class }),
      0,
    ]
  },

  addCommands() {
    return {
      setComment:
        (commentId: string) =>
        ({ commands }) => {
          return commands.setMark(this.name, { commentId })
        },

      unsetComment:
        (commentId?: string) =>
        ({ commands, tr, state }) => {
          if (commentId) {
            // 移除指定批注
            const { doc } = state
            let hasChanges = false

            doc.descendants((node, pos) => {
              if (node.isText && node.marks.length > 0) {
                const commentMark = node.marks.find(
                  (mark) =>
                    mark.type.name === this.name &&
                    mark.attrs.commentId === commentId,
                )
                if (commentMark) {
                  tr.removeMark(pos, pos + node.nodeSize, commentMark.type)
                  hasChanges = true
                }
              }
            })

            return hasChanges
          }
          // 移除所有批注
          return commands.unsetMark(this.name)
        },

      getAllComments:
        () =>
        ({ state }): any => {
          const comments: Array<{
            id: string
            from: number
            to: number
            text: string
          }> = []
          const commentMap = new Map<string, { from: number; to: number; text: string }>()

          state.doc.descendants((node, pos) => {
            if (node.isText && node.marks.length > 0) {
              const commentMark = node.marks.find(
                (mark) => mark.type.name === this.name && mark.attrs.commentId,
              )
              if (commentMark) {
                const commentId = commentMark.attrs.commentId
                const existing = commentMap.get(commentId)
                if (existing) {
                  // 扩展范围
                  existing.to = pos + node.nodeSize
                  existing.text += node.text || ''
                } else {
                  // 新批注
                  commentMap.set(commentId, {
                    from: pos,
                    to: pos + node.nodeSize,
                    text: node.text || '',
                  })
                }
              }
            }
          })

          commentMap.forEach((value, key) => {
            comments.push({
              id: key,
              ...value,
            })
          })

          return comments
        },

      focusComment:
        (commentId: string) =>
        ({ editor, view }) => {
          const element = view.dom.querySelector(
            `span[data-comment-id="${commentId}"]`,
          )
          if (element) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest',
            })
            const pos = view.posAtDOM(element, 0)
            editor.commands.setTextSelection(pos)
            editor.commands.focus()
            return true
          }
          return false
        },

      deleteComment:
        (commentId: string) =>
        ({ commands }) => {
          return commands.unsetComment(commentId)
        },
    }
  },

})
