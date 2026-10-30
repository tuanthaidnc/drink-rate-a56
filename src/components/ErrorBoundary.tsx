import React from 'react';
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="recovery-screen">
        <h1>NỐT chưa mở được màn hình này</h1>
        <p>
          Dữ liệu đã lưu trên thiết bị được giữ nguyên. Hãy tải lại ứng dụng; nếu lỗi lặp lại, mở
          phần Thống kê để xuất bản sao.
        </p>
        <button className="button" onClick={() => location.reload()}>
          Mở lại ứng dụng
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
