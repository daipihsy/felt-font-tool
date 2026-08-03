interface HelpScreenProps {
  onBack: () => void
}

export function HelpScreen({ onBack }: HelpScreenProps) {
  return (
    <div className="editor">
      <div className="topbar">
        <button className="topbar-btn" onClick={onBack}>
          返回
        </button>
        <div className="topbar-title">使用说明</div>
        <span style={{ width: 44 }} />
      </div>

      <div className="screen" style={{ overflowY: 'auto' }}>
        <div className="content">
          <h2>基本步骤</h2>
          <ol>
            <li>点击“导入产品图片”</li>
            <li>输入需要制作的名字</li>
            <li>用手指拖动名字的位置</li>
            <li>用双指或滑块调整名字大小</li>
            <li>点击“全屏预览”查看效果</li>
            <li>确认后下载或分享高清图片</li>
          </ol>

          <h2>不导入图片，直接预览字体</h2>
          <div className="card">
            在首页点击“白底排字（免导入图片）”，选择画布比例，即可在纯白背景上输入名字、切换字体预览效果，并直接下载成图片。
          </div>

          <h2>导入字体</h2>
          <div className="card">
            打开“字体管理”，点击“导入字体”，选择手机中的 TTF 或 OTF
            字体文件。导入成功后，即可在编辑页面使用。
          </div>

          <h2>如何添加到手机桌面</h2>
          <ol>
            <li>使用 Chrome 打开本网页</li>
            <li>点击浏览器右上角菜单</li>
            <li>选择“添加到主屏幕”或“安装应用”</li>
            <li>安装后可以像普通软件一样打开</li>
          </ol>

          <h2>本地数据说明</h2>
          <div className="card">
            导入的字体和草稿只保存在当前手机浏览器中。清除浏览器数据后可能会丢失。
          </div>
        </div>
      </div>
    </div>
  )
}
