#!/bin/bash
echo "=================================="
echo "Testing moguedu.ca after DNS update"
echo "=================================="
echo ""

echo "⏳ Waiting 10 seconds for DNS propagation..."
sleep 10

echo ""
echo "🌐 Testing moguedu.ca:"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://moguedu.ca --max-time 10)
TITLE=$(curl -sL https://moguedu.ca 2>&1 | grep -o '<title>[^<]*</title>' | head -1)

echo "  HTTP Status: $STATUS"
echo "  Page Title: $TITLE"

if echo "$TITLE" | grep -qi "MOGU Edu"; then
    echo "  ✅ SUCCESS! MOGU website is now live!"
else
    echo "  ⚠️  Still showing old site. Wait 5 more minutes."
fi

echo ""
echo "🌐 Testing www.moguedu.ca:"
STATUS_WWW=$(curl -s -o /dev/null -w "%{http_code}" https://www.moguedu.ca --max-time 10)
echo "  HTTP Status: $STATUS_WWW"

if [ "$STATUS_WWW" = "200" ]; then
    echo "  ✅ www subdomain works!"
else
    echo "  ⚠️  www not ready yet"
fi

echo ""
echo "🔐 Testing Admin Panel:"
STATUS_ADMIN=$(curl -s -o /dev/null -w "%{http_code}" https://moguedu.ca/admin/login --max-time 10)
echo "  HTTP Status: $STATUS_ADMIN"

if [ "$STATUS_ADMIN" = "200" ]; then
    echo "  ✅ Admin panel accessible!"
else
    echo "  ⚠️  Admin panel not ready yet"
fi

echo ""
echo "=================================="
echo "Run again: bash test-after-dns.sh"
echo "=================================="
