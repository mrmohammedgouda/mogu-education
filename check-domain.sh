#!/bin/bash

echo "==================================="
echo "MOGU Domain Status Checker"
echo "==================================="
echo ""

# Check Cloudflare Pages domains status
echo "📊 Cloudflare Pages Domain Status:"
curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/18fe3ade8fcaebf44cb0273a920c0744/pages/projects/moguedu/domains" \
  -H "Authorization: Bearer F6MWGtpYgR0p1uFaQglIpdh9ZNHNKqMN-Jf_oDs6" \
  -H "Content-Type: application/json" | jq -r '.result[] | "  \(.name) - Status: \(.status) | Validation: \(.validation_data.status)"'

echo ""
echo "🌐 Website Accessibility Test:"
echo ""

# Test moguedu.ca
echo -n "  moguedu.ca: "
if curl -s -o /dev/null -w "%{http_code}" https://moguedu.ca --max-time 5 | grep -q "200"; then
    echo "✅ Accessible (200 OK)"
else
    echo "❌ Not accessible"
fi

# Test www.moguedu.ca
echo -n "  www.moguedu.ca: "
if curl -s -o /dev/null -w "%{http_code}" https://www.moguedu.ca --max-time 5 | grep -q "200"; then
    echo "✅ Accessible (200 OK)"
else
    echo "❌ Not accessible"
fi

# Test admin panel
echo -n "  moguedu.ca/admin/login: "
if curl -s -o /dev/null -w "%{http_code}" https://moguedu.ca/admin/login --max-time 5 | grep -q "200"; then
    echo "✅ Accessible (200 OK)"
else
    echo "❌ Not accessible"
fi

echo ""
echo "📄 Page Content Check:"
TITLE=$(curl -s https://moguedu.ca 2>&1 | grep -o '<title>[^<]*</title>' | head -1)
echo "  Current title: $TITLE"

if echo "$TITLE" | grep -qi "MOGU"; then
    echo "  ✅ MOGU website is active"
else
    echo "  ⚠️  Old website still showing (DNS not updated yet)"
fi

echo ""
echo "==================================="
echo "To run this check again: bash check-domain.sh"
echo "==================================="
