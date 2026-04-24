import json

with open(r'd:\Nam3ki2\NoCodeLowCode\clm-automation-system\workflow\CLM workflow 3.json', 'r', encoding='utf-8') as f:
    wf = json.load(f)

# 1. Create the new PayOS node
new_node = {
    "parameters": {
        "method": "POST",
        "url": "http://backend:8000/api/bills/draft-and-qr",
        "sendBody": True,
        "bodyParameters": {
            "parameters": [
                { "name": "phong", "value": "={{ $('2. Tính Toán & VietQR').item.json.phong }}" },
                { "name": "tong_tien", "value": "={{ $('2. Tính Toán & VietQR').item.json.val_tong }}" },
                { "name": "thang_nam", "value": "={{ $('2. Tính Toán & VietQR').item.json.thangDisplay }}" },
                { "name": "chi_so_dien_moi", "value": "={{ $('2. Tính Toán & VietQR').item.json.chi_so_dien_moi }}" },
                { "name": "chi_so_dien_cu", "value": "={{ $('2. Tính Toán & VietQR').item.json.chi_so_dien_cu }}" },
                { "name": "chi_so_nuoc_cu", "value": "={{ $('2. Tính Toán & VietQR').item.json.chi_so_nuoc_cu }}" },
                { "name": "chi_so_nuoc_moi", "value": "={{ $('2. Tính Toán & VietQR').item.json.chi_so_nuoc_moi }}" },
                { "name": "pdf_base64", "value": "" }
            ]
        },
        "options": {}
    },
    "id": "new-payos-node-id",
    "name": "API Lấy QR PayOS",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4,
    "position": [200, 1024]
}

# Add node
if not any(n['name'] == 'API Lấy QR PayOS' for n in wf['nodes']):
    wf['nodes'].append(new_node)

# 2. Modify "3. Dàn trang HTML"
for node in wf['nodes']:
    if node['name'] == '3. Dàn trang HTML':
        node['parameters']['jsCode'] = """const d = $json;
const payos = $('API Lấy QR PayOS').item.json;
const qrUrl = payos.qr_image_url || d.qrUrl;

const html = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 40px; color: #333; }
        .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); font-size: 16px; line-height: 24px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1e40af; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { margin: 0; color: #1e40af; font-size: 32px; }
        .info-table { width: 100%; margin-bottom: 30px; }
        .info-table td { padding: 5px; }
        .billing-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .billing-table th, .billing-table td { padding: 12px; border: 1px solid #ddd; text-align: left; }
        .billing-table th { background-color: #f8fafc; color: #1e40af; font-weight: bold; }
        .total-row { font-size: 18px; font-weight: bold; background-color: #e2e8f0; }
        .total-row td { color: #dc2626; text-align: right; }
        .footer { text-align: center; margin-top: 40px; font-size: 14px; color: #666; }
        .qr-container { text-align: center; margin-top: 20px; }
        .qr-container img { border: 1px solid #ccc; border-radius: 8px; padding: 10px; background: white; }
    </style>
</head>
<body>
    <div class="invoice-box">
        <div class="header">
            <div>
                <h1>HÓA ĐƠN THANH TOÁN</h1>
                <p>Kỳ cước: Tháng ${d.thangDisplay}</p>
            </div>
            <div style="text-align: right;">
                <h2 style="margin: 0; color: #dc2626;">Phòng: ${d.phong}</h2>
            </div>
        </div>
        
        <table class="info-table">
            <tr>
                <td><strong>Khách hàng:</strong> ${d.hoTen}</td>
                <td style="text-align: right;"><strong>Ngày lập:</strong> ${new Date().toLocaleDateString('vi-VN')}</td>
            </tr>
        </table>

        <table class="billing-table">
            <thead>
                <tr>
                    <th>Hạng mục</th>
                    <th>Chỉ số đầu</th>
                    <th>Chỉ số cuối</th>
                    <th style="text-align: right;">Thành tiền</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Tiền thuê phòng</td>
                    <td>-</td>
                    <td>-</td>
                    <td style="text-align: right;">${d.txt_phong}</td>
                </tr>
                <tr>
                    <td>Tiền điện</td>
                    <td>${d.chi_so_dien_cu}</td>
                    <td>${d.chi_so_dien_moi}</td>
                    <td style="text-align: right;">${d.txt_dien || 'Tính gộp'}</td>
                </tr>
                <tr>
                    <td>Tiền nước</td>
                    <td>${d.chi_so_nuoc_cu}</td>
                    <td>${d.chi_so_nuoc_moi}</td>
                    <td style="text-align: right;">${d.txt_nuoc || 'Tính gộp'}</td>
                </tr>
                <tr class="total-row">
                    <td colspan="3" style="text-align: right;">TỔNG CỘNG:</td>
                    <td>${d.txt_tong}</td>
                </tr>
            </tbody>
        </table>

        <div class="qr-container">
            <h3>Quét mã QR để thanh toán nhanh</h3>
            <img src="${qrUrl}" alt="PayOS QR" width="250" />
            <p>Nội dung CK: <strong>P${d.phong}</strong></p>
            ${payos.checkout_url ? `<p><a href="${payos.checkout_url}">Hoặc nhấn vào đây để mở trang thanh toán</a></p>` : ''}
        </div>

        <div class="footer">
            <p>Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!</p>
            <p>Mọi thắc mắc xin vui lòng liên hệ Ban Quản Lý CLM.</p>
        </div>
    </div>
</body>
</html>`;
return {
  json: { ...d, qrUrl },
  binary: {
    indexHtml: await this.helpers.prepareBinaryData(Buffer.from(html), 'index.html', 'text/html')
  }
};"""

# 3. Update Connections
conns = wf['connections']

# From 2. Tính Toán & VietQR -> API Lấy QR PayOS
if '2. Tính Toán & VietQR' in conns:
    conns['2. Tính Toán & VietQR'] = {
        "main": [
            [
                { "node": "API Lấy QR PayOS", "type": "main", "index": 0 }
            ]
        ]
    }

# From API Lấy QR PayOS -> Merge Data and 3. Dàn trang HTML
conns['API Lấy QR PayOS'] = {
    "main": [
        [
            { "node": "Merge Data", "type": "main", "index": 0 },
            { "node": "3. Dàn trang HTML", "type": "main", "index": 0 }
        ]
    ]
}

with open(r'd:\Nam3ki2\NoCodeLowCode\clm-automation-system\workflow\CLM workflow 3.json', 'w', encoding='utf-8') as f:
    json.dump(wf, f, indent=2, ensure_ascii=False)
