import { useCallback, useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SpaceCard } from '../../components/SpaceCard/SpaceCard';
import { SpaceEditor } from '../SpaceEditor/SpaceEditor';
import type { Space } from '../../lib/spacesTypes';
import styles from './SpacesPage.module.css';

interface Props { uid: string; }

export function SpacesPage({ uid }: Props) {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const loadSpaces = useCallback(async () => {
    try {
      const q = query(collection(db, 'users', uid, 'spaces'), orderBy('updatedAt', 'desc'));
      const snap = await getDocs(q);
      setSpaces(snap.docs.map(d => ({ id: d.id, ...d.data() } as Space)));
    } catch (err) {
      console.error('Erro ao carregar spaces:', err);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => { loadSpaces(); }, [loadSpaces]);

  const handleNew = useCallback(async () => {
    const name = 'Sem título';
    const docRef = await addDoc(collection(db, 'users', uid, 'spaces'), {
      name, userId: uid, nodes: [], edges: [], thumbnail: null,
      createdAt: Date.now(), updatedAt: Date.now(),
    });
    setEditingName(name);
    setEditingId(docRef.id);
  }, [uid]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'users', uid, 'spaces', id));
    setSpaces(prev => prev.filter(s => s.id !== id));
  }, [uid]);

  const handleOpen = useCallback((space: Space) => {
    setEditingName(space.name);
    setEditingId(space.id);
  }, []);

  const handleClose = useCallback(() => {
    setEditingId(null);
    loadSpaces();
  }, [loadSpaces]);

  if (editingId) {
    return <SpaceEditor uid={uid} spaceId={editingId} spaceName={editingName} onClose={handleClose} />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h2 className={styles.title}>Spaces</h2>
        <button className={styles.newBtn} onClick={handleNew}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Novo Space
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      ) : spaces.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
          </div>
          <p className={styles.emptyTitle}>Nenhum space ainda</p>
          <p className={styles.emptyDesc}>Crie um canvas infinito para compor fluxos de geração de imagem</p>
          <button className={styles.newBtnLg} onClick={handleNew}>Criar primeiro Space</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {spaces.map(s => (
            <SpaceCard key={s.id} space={s} onClick={() => handleOpen(s)} onDelete={() => handleDelete(s.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
