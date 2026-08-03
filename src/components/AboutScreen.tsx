interface AboutScreenProps {
  onBack: () => void
}

export function AboutScreen({ onBack }: AboutScreenProps) {
  return (
    <div className="editor">
      <div className="topbar">
        <button className="topbar-btn" onClick={onBack}>
          返回
        </button>
        <div className="topbar-title">关于</div>
        <span style={{ width: 44 }} />
      </div>

      <div className="screen" style={{ overflowY: 'auto' }}>
        <div className="content">
          <h2>关于本工具</h2>
          <div className="card">
            毛毡排字助手是一个完全在浏览器本地运行的排字工具，帮助手工作坊在产品图片上预览宠物名字的字体排版效果。
          </div>

          <h2>隐私说明</h2>
          <div className="card">
            <p>本工具完全在浏览器本地运行。</p>
            <p>
              你导入的图片、输入的文字和字体文件不会上传到服务器。草稿和自定义字体只保存在当前设备的当前浏览器中。
            </p>
            <p>清除浏览器网站数据后，本地草稿和自定义字体可能会丢失。</p>
          </div>

          <h2>字体许可</h2>
          <div className="card">
            <p>
              内置字体：Playwrite NZ Guides（文件：PlaywriteNZGuides-Regular.ttf）。
            </p>
            <p>请在正式公开发布前确认所有内置及导入字体的授权范围。</p>
          </div>

          <p style={{ color: 'var(--color-text-soft)', fontSize: 'var(--font-sm)' }}>
            本应用不含广告、统计或第三方追踪脚本。
          </p>
        </div>
      </div>
    </div>
  )
}
