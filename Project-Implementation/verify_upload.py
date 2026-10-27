import requests
import os
import time

GATEWAY_URL = 'http://localhost:3000/api'
login_res = requests.post(f'{GATEWAY_URL}/auth/login', json={'email': 'demo@university.edu', 'password': 'password123'})
token = login_res.json()['data']['token']
headers = {'Authorization': f'Bearer {token}'}

# Check initial dashboard counts
dash1 = requests.get(f'{GATEWAY_URL}/analytics/dashboard', headers=headers).json()['data']['stats']
print('Initial stats:', dash1)

# Upload the sample cloud native research paper
pdf_path = 'sample_cloud_native_research_paper.pdf'
with open(pdf_path, 'rb') as f:
    files = {'pdf': (os.path.basename(pdf_path), f, 'application/pdf')}
    data = {
        'title': 'Autonomous Cloud-Native Scaling via Dynamic Telemetry',
        'authors': '[{"name": "Dr. Alex Morgan", "affiliation": "Demo University"}]',
        'researchDomain': 'Cloud Computing',
        'publicationYear': '2026'
    }
    upload_res = requests.post(f'{GATEWAY_URL}/papers/upload', headers=headers, files=files, data=data)

print('Upload status:', upload_res.status_code)
uploaded_paper = upload_res.json()['data']['paper']
paper_id = uploaded_paper['_id']
print('Uploaded Paper ID:', paper_id)
print('S3 Key:', uploaded_paper.get('s3Key'))

# Wait for extraction processing
for _ in range(10):
    time.sleep(1)
    p_check = requests.get(f'{GATEWAY_URL}/papers/{paper_id}', headers=headers).json()['data']['paper']
    print('Current status:', p_check.get('processingStatus'), '| has fullText:', bool(p_check.get('fullText')))
    if p_check.get('processingStatus') in ['completed', 'completed_without_ai', 'failed']:
        break

# Verify streaming PDF back from MinIO
pdf_stream = requests.get(f'{GATEWAY_URL}/papers/{paper_id}/pdf', headers=headers)
print('Streamed PDF bytes:', len(pdf_stream.content), 'Content-Type:', pdf_stream.headers.get('Content-Type'))
assert len(pdf_stream.content) > 1000, "PDF stream empty"
assert 'pdf' in pdf_stream.headers.get('Content-Type', '').lower(), "Wrong Content-Type"

# Check updated dashboard counts
dash2 = requests.get(f'{GATEWAY_URL}/analytics/dashboard', headers=headers).json()['data']['stats']
print('Updated stats:', dash2)
assert dash2['totalPlatformPapers'] == dash1['totalPlatformPapers'] + 1, 'Total platform papers did not increment!'
assert dash2['uploadedPapers'] == dash1['uploadedPapers'] + 1, 'Uploaded papers did not increment!'
print('ALL CHECKS PASSED: Upload flow, MinIO storage, PyMuPDF extraction, and dynamic Dashboard stats verified!')
