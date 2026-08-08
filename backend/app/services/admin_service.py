import psutil
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User
from app.models.document import Document
from app.schemas.admin import AdminOverviewResponse, AdminSystemMonitoring

def get_admin_overview_data(db: Session) -> AdminOverviewResponse:
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_kb_docs = db.query(func.count(Document.id)).filter(Document.is_knowledge_base == True).scalar() or 0
    total_bytes = db.query(func.sum(Document.file_size)).scalar() or 0
    storage_mb = round(total_bytes / (1024 * 1024), 2)

    return AdminOverviewResponse(
        total_users=total_users,
        total_kb_documents=total_kb_docs,
        jobs_queued=0,
        storage_used_mb=storage_mb
    )

def get_system_monitoring_data() -> AdminSystemMonitoring:
    cpu = psutil.cpu_percent(interval=None)
    mem = psutil.virtual_memory().percent
    disk = psutil.disk_usage('/').percent

    return AdminSystemMonitoring(
        cpu_usage_pct=cpu,
        memory_usage_pct=mem,
        disk_usage_pct=disk,
        api_uptime_pct=99.98,
        error_rate_pct=0.0
    )
