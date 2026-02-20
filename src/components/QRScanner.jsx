import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { useRace } from '../context/RaceContext'

export default function QRScanner() {
    const { scanRider, loading } = useRace()
    const scannerRef = useRef(null)
    const containerRef = useRef(null)
    const [isScanning, setIsScanning] = useState(false)

    const startScanner = async () => {
        if (scannerRef.current) return
        try {
            const scanner = new Html5Qrcode('qr-reader')
            scannerRef.current = scanner
            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 220, height: 220 } },
                (decodedText) => {
                    // Pause scanning while processing
                    scanner.pause()
                    scanRider(decodedText).finally(() => {
                        try { scanner.resume() } catch { /* may have stopped */ }
                    })
                },
                () => { } // ignore scan failures
            )
            setIsScanning(true)
        } catch (err) {
            console.error('QR scanner error:', err)
        }
    }

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop()
                scannerRef.current.clear()
            } catch { /* already stopped */ }
            scannerRef.current = null
            setIsScanning(false)
        }
    }

    useEffect(() => {
        return () => { stopScanner() }
    }, [])

    return (
        <div className="card">
            <div className="panel-title">📷 QR Scanner</div>
            <div
                id="qr-reader"
                ref={containerRef}
                className="qr-scanner-container"
                style={{ minHeight: isScanning ? 'auto' : '180px', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                {!isScanning && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Camera off</span>
                )}
            </div>
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                {!isScanning ? (
                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={startScanner} disabled={loading}>
                        Start Camera
                    </button>
                ) : (
                    <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={stopScanner}>
                        Stop Camera
                    </button>
                )}
            </div>
        </div>
    )
}
