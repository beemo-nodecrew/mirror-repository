import React, { useRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import TodoList from '../components/TodoList';

import bucketApi from '../api/bucketApi';

import styles from '../styles/components/Bucket.module.css';
import errorMessages from '../config/errorMessages';

function Bucket({ bucket, fetchBuckets, modalOpen, modalClose }) {
  const MAX_LENGTH = 20; // 최대 타이틀 글자수
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 최대 사진 용량 5MB

  const { id, fixedTodoId, todoAll, todoCompleted } = bucket;
  const progress = (todoCompleted / todoAll) * 100;

  const CreateBucketId = useSelector((state) => state.bucket.bucketId);
  const [isToggled, setIsToggled] = useState(CreateBucketId === id ? true : false);

  const fileInputRef = useRef(null);
  const [imageUrl, setImageUrl] = useState(bucket.imageUrl);
  const [inputData, setInputData] = useState({
    title: '',
    file: '',
  });

  // title, imageUrl 초기값 및 업데이트
  useEffect(() => {
    setInputData({
      title: bucket.title || '',
      file: bucket.imageUrl || '',
    });
    setImageUrl(bucket.imageUrl);
  }, [bucket]);

  useEffect(() => {
    handleFileUpdate();
  }, [inputData]);

  // 버킷 리스트 get
  const fetchBucket = async () => {
    try {
      await bucketApi.getBuckets();
    } catch (error) {
      const errorMessage =
        errorMessages[error.status]?.[error.code] || errorMessages[error.status]?.DEFAULT;
      const modalData = {
        content: errorMessage,
        cancelText: '확인',
        onConfirm: false,
      };

      modalOpen(modalData);
    }
  };

  // title 수정
  const handleTitleChange = (e) => {
    const { name, value } = e.target;
    // 한글 입력 시에도 최대 글자 수 제한 적용
    if (value.length > MAX_LENGTH) return;
    setInputData((prev) => ({ ...prev, [name]: value }));
  };

  // title 업데이트
  const handleTitleUpdate = async () => {
    const formData = new FormData();
    formData.append('title', inputData.title);

    try {
      const response = await bucketApi.updateBucket(id, formData);

      await fetchBucket();
    } catch (error) {
      const errorMessage =
        errorMessages[error.status]?.[error.code] || errorMessages[error.status]?.DEFAULT;
      const modalData = {
        content: errorMessage,
        cancelText: '확인',
        onConfirm: false,
      };

      modalOpen(modalData);
    }
  };

  // image 수정
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (file.name.includes(' ')) {
      const modalData = {
        content: '파일 이름에 공백(띄어쓰기)이 포함될 수 없습니다.',
        cancelText: '확인',
        onConfirm: false,
      };
      modalOpen(modalData);
      e.target.value = '';
      return;
    }

    if (!file.type.startsWith('image/') || !allowedExtensions.includes(fileExtension)) {
      const modalData = {
        content: '이미지 파일(jpg, jpeg, png, gif, webp)만 업로드 가능합니다.',
        cancelText: '확인',
        onConfirm: false,
      };

      modalOpen(modalData);
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      modalOpen({
        content: '5MB 이하의 이미지만 업로드 가능합니다.',
        cancelText: '확인',
        onConfirm: false,
      });
    }

    setInputData((prev) => ({ ...prev, file }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // image 업데이트
  const handleFileUpdate = async () => {
    if (inputData.title == '') return; // 빈 제목 방지
    const formData = new FormData();
    formData.append('file', inputData.file);
    formData.append('title', inputData.title);

    try {
      await bucketApi.updateBucket(id, formData);
      fetchBucket();
    } catch (error) {
      const errorMessage =
        errorMessages[error.status]?.[error.code] ||
        errorMessages[error.status]?.DEFAULT ||
        '이미지를 업로드할 수 없습니다.';
      const modalData = {
        content: errorMessage,
        cancelText: '확인',
        onConfirm: false,
      };

      modalOpen(modalData);
    }
  };

  // 토글 버튼
  const handleToggle = () => {
    setIsToggled(!isToggled);
  };

  // 버킷 삭제 버튼
  const handleDeleteBucket = () => {
    const modalData = {
      content: '버킷을 삭제하시겠습니까 ?',
      cancelText: '취소',
      confirmText: '확인',
      onConfirm: () => deleteBucket(),
    };

    modalOpen(modalData);
    return;
  };

  // 버킷 삭제
  const deleteBucket = async () => {
    modalClose();

    try {
      await bucketApi.deleteBucket(id);
      fetchBuckets();
    } catch (error) {
      const errorMessage =
        errorMessages[error.status]?.[error.code] || errorMessages[error.status]?.DEFAULT;
      const modalData = {
        content: errorMessage,
        cancelText: '확인',
        onConfirm: false,
      };

      modalOpen(modalData);
    }
  };

  // 이미지 삭제 버튼
  const handleDeleteImage = async () => {
    const modalData = {
      content: '이미지를 삭제하시겠습니까 ?',
      cancelText: '취소',
      confirmText: '확인',
      onConfirm: () => deleteImage(),
    };

    modalOpen(modalData);
    return;
  };

  // 이미지 삭제
  const deleteImage = async () => {
    modalClose(true);
    setImageUrl(null);

    try {
      await bucketApi.deleteBucketImage(id);
      fetchBuckets();
    } catch (error) {
      const errorMessage =
        errorMessages[error.status]?.[error.code] || errorMessages[error.status]?.DEFAULT;
      const modalData = {
        content: errorMessage,
        cancelText: '확인',
        onConfirm: false,
      };

      modalOpen(modalData);
    }
  };

  return (
    <>
      <section className={styles.section}>
        <article className={styles.bucket}>
          <>
            <div
              style={
                isToggled
                  ? imageUrl
                    ? { backgroundColor: 'transparent' }
                    : {}
                  : { opacity: '0', width: '0' }
              }
              className={styles.imageBox}
            >
              {imageUrl && <img src={imageUrl} alt="미리보기" />}

              <form>
                <input
                  className={styles.imageInput}
                  type="file"
                  accept="image/*"
                  loading="lazy"
                  ref={fileInputRef}
                  name="image_path"
                  onChange={handleFileChange}
                  disabled={isToggled ? false : true}
                />
              </form>

              <div className={styles.imageButtonBox}>
                <button
                  className={styles.addImageButton}
                  onClick={() => fileInputRef.current?.click()}
                >
                  추가
                </button>
                <button
                  style={imageUrl ? {} : { display: 'none' }}
                  className={styles.deleteImageButton}
                  onClick={handleDeleteImage}
                >
                  삭제
                </button>
              </div>
            </div>
          </>

          <>
            <form style={isToggled ? {} : { width: '68%' }}>
              <input
                type="text"
                name="title"
                value={inputData.title}
                placeholder="버킷 리스트 내용을 입력해주세요."
                onChange={handleTitleChange}
                onBlur={handleTitleUpdate}
                maxLength={MAX_LENGTH}
                disabled={isToggled ? false : true}
              />
              <div className={styles.progressBarBox}>
                <p>진행률</p>
                <div
                  style={
                    progress === 100
                      ? {
                          background: '#71c4ef',
                        }
                      : {
                          background: `linear-gradient(to right, #71c4ef, #fffefb  ${progress.toFixed()}%)`,
                        }
                  }
                  className={styles.progressBar}
                >
                  <p>{progress.toFixed()}%</p>
                </div>
              </div>
            </form>
          </>

          <>
            <div className={styles.buttonBox}>
              <button className={styles.toggleButton} onClick={handleToggle}>
                {isToggled ? (
                  <img src="/assets/icon-up.png" alt="위쪽 화살표 아이콘" />
                ) : (
                  <img
                    style={{ transform: 'rotate(180deg)' }}
                    src="/assets/icon-up.png"
                    alt="아래쪽 화살표 아이콘"
                  />
                )}
              </button>
              <button className={styles.deleteButton} onClick={handleDeleteBucket}>
                <img src="/assets/icon-close.png" alt="닫기 아이콘" />
              </button>
            </div>
          </>
        </article>

        <TodoList
          fetchBuckets={fetchBuckets}
          imageUrl={imageUrl}
          isToggled={isToggled}
          bucketId={id}
          fixedTodoId={fixedTodoId}
          modalOpen={modalOpen}
          modalClose={modalClose}
        />
      </section>
    </>
  );
}

export default Bucket;
