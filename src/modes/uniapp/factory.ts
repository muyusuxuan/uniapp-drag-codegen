import type { CanvasNode, EditorDocument, PageMeta, TabBarConfig } from '@/types/editor'
import { uid } from '@/utils/helpers'

export function createUniNode(type: CanvasNode['type']): CanvasNode {
  const id = uid(type.replace('-', '').slice(0, 6))
  switch (type) {
    case 'view':
      return {
        id,
        type,
        name: '容器',
        props: {},
        style: {
          width: '100%',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          gap: '8px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
        },
        children: [],
      }
    case 'row':
      return {
        id,
        type,
        name: '横向容器',
        props: {},
        style: {
          width: '100%',
          minHeight: '56px',
          padding: '8px',
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: '8px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
        },
        children: [],
      }
    case 'scroll-view':
      return {
        id,
        type,
        name: '滚动容器',
        props: { scrollY: 'true' },
        style: {
          width: '100%',
          height: '180px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          backgroundColor: '#f7f8fa',
          borderRadius: '12px',
          overflow: 'auto',
        },
        children: [],
      }
    case 'text':
      return {
        id,
        type,
        name: '文本',
        props: { text: '一段文字' },
        style: {
          fontSize: '16px',
          color: '#1c2333',
          lineHeight: '1.5',
        },
      }
    case 'button':
      return {
        id,
        type,
        name: '按钮',
        props: { text: '立即体验', buttonType: 'primary' },
        style: {
          width: '100%',
          height: '44px',
          fontSize: '16px',
          color: '#ffffff',
          backgroundColor: '#07c160',
          borderRadius: '8px',
        },
      }
    case 'image':
      return {
        id,
        type,
        name: '图片',
        props: { src: '/static/logo.png', mode: 'aspectFill' },
        style: {
          width: '100%',
          height: '160px',
          borderRadius: '12px',
          backgroundColor: '#e8eef8',
        },
      }
    case 'input':
      return {
        id,
        type,
        name: '输入框',
        props: { placeholder: '请输入内容', value: '' },
        style: {
          width: '100%',
          height: '40px',
          padding: '0 12px',
          fontSize: '14px',
          backgroundColor: '#f5f6f8',
          borderRadius: '8px',
          color: '#1c2333',
        },
      }
    case 'swiper':
      return {
        id,
        type,
        name: '轮播',
        props: {
          indicatorDots: 'true',
          autoplay: 'true',
          src1: '/static/logo.png',
          src2: '/static/logo.png',
          src3: '/static/logo.png',
        },
        style: {
          width: '100%',
          height: '180px',
          borderRadius: '12px',
        },
      }
    case 'navigator':
      return {
        id,
        type,
        name: '跳转单元格',
        props: { text: '查看更多', url: '/pages/index/index' },
        style: {
          width: '100%',
          height: '48px',
          padding: '0 12px',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          color: '#1c2333',
          fontSize: '15px',
        },
      }
  }
}

export function defaultPage(): PageMeta {
  return {
    title: '首页',
    backgroundColor: '#f5f6f8',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black',
  }
}

export function defaultTabBar(): TabBarConfig {
  return {
    enabled: false,
    color: '#999999',
    selectedColor: '#07c160',
    backgroundColor: '#ffffff',
    list: [
      { id: uid('tab'), text: '首页', pageKey: 'index' },
      { id: uid('tab'), text: '我的', pageKey: 'mine' },
    ],
  }
}

export function createUniExample(): Pick<EditorDocument, 'page' | 'nodes' | 'tabBar'> {
  const hero = createUniNode('view')
  hero.style.padding = '16px'
  hero.style.gap = '12px'
  hero.style.backgroundColor = 'transparent'

  const title = createUniNode('text')
  title.props.text = '欢迎来到示例商城'
  title.style.fontSize = '22px'
  title.style.fontWeight = '700'
  title.style.color = '#111827'

  const subtitle = createUniNode('text')
  subtitle.props.text = '左侧拖组件，中间画布可直接拖拽排序与嵌套，右侧改属性。横向容器可让多个组件排在同一行。'
  subtitle.style.fontSize = '13px'
  subtitle.style.color = '#667085'

  const banner = createUniNode('image')
  banner.style.height = '148px'

  const cols = createUniNode('row')
  cols.style.alignItems = 'stretch'
  const colA = createUniNode('view')
  colA.style.width = 'auto'
  colA.style.flex = '1'
  colA.style.backgroundColor = '#eef6ff'
  const textA = createUniNode('text')
  textA.props.text = '热卖专区'
  textA.style.fontSize = '14px'
  textA.style.fontWeight = '700'
  colA.children = [textA]
  const colB = createUniNode('view')
  colB.style.width = 'auto'
  colB.style.flex = '1'
  colB.style.backgroundColor = '#f3eefc'
  const textB = createUniNode('text')
  textB.props.text = '新品上市'
  textB.style.fontSize = '14px'
  textB.style.fontWeight = '700'
  colB.children = [textB]
  cols.children = [colA, colB]

  const actions = createUniNode('row')
  const btn = createUniNode('button')
  btn.props.text = '立即体验'
  btn.style.width = 'auto'
  btn.style.flex = '1'
  const more = createUniNode('button')
  more.props.text = '了解更多'
  more.props.buttonType = 'default'
  more.style.width = 'auto'
  more.style.flex = '1'
  more.style.backgroundColor = '#e8eef8'
  more.style.color = '#1c2333'
  actions.children = [btn, more]

  const cell = createUniNode('navigator')
  cell.props.text = '个人中心'

  hero.children = [title, subtitle, banner, cols, actions, cell]

  const tabBar = defaultTabBar()
  tabBar.enabled = true

  return {
    page: {
      title: '商城首页',
      backgroundColor: '#f5f6f8',
      navigationBarBackgroundColor: '#ffffff',
      navigationBarTextStyle: 'black',
    },
    nodes: [hero],
    tabBar,
  }
}
